import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Phone, MapPin, FileText, Sparkles, ArrowRight, ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { isValidGstin } from "@/utils/gstCalc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import posthog from "@/lib/posthog";

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const TRANSITION = { duration: 0.22, ease: "easeOut" as const };

type StepId = "store" | "details" | "done";

const STEPS: StepId[] = ["store", "details", "done"];

export default function Onboarding() {
  const navigate = useNavigate();
  const { tenant, user, markOnboardingComplete } = useAuth();

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  // Form state — pre-fill from tenant
  const [storeName, setStoreName] = useState(tenant?.name ?? "");
  const [storePhone, setStorePhone] = useState(tenant?.phone ?? "");
  const [storeAddress, setStoreAddress] = useState(tenant?.address ?? "");
  const [storeGSTIN, setStoreGSTIN] = useState(tenant?.gstin ?? "");

  const currentStep = STEPS[stepIdx];
  const isLastDataStep = stepIdx === 1;

  const go = (delta: number) => {
    setDir(delta);
    setStepIdx((i) => i + delta);
  };

  const gstinError =
    storeGSTIN.length > 0 && storeGSTIN.length !== 15
      ? "GSTIN must be 15 characters"
      : storeGSTIN.length === 15 && !isValidGstin(storeGSTIN)
      ? "Invalid GSTIN format"
      : null;

  const saveAndFinish = async () => {
    setSaving(true);
    posthog.capture("onboarding.completed");
    try {
      // Persist tenant details if the tenant exists
      if (tenant?.id) {
        const updates: Record<string, string | null> = {};
        if (storeName.trim()) updates.name = storeName.trim();
        if (storePhone.trim()) updates.phone = storePhone.trim();
        if (storeAddress.trim()) updates.address = storeAddress.trim();
        if (storeGSTIN.trim() && !gstinError) updates.gstin = storeGSTIN.trim().toUpperCase();
        if (Object.keys(updates).length > 0) {
          await supabase.from("tenants").update(updates).eq("id", tenant.id);
        }
      }
      // Optimistic state update first — prevents OnboardingGate from redirecting back
      await markOnboardingComplete();
    } catch (err) {
      console.error("Onboarding save error:", err);
    } finally {
      setSaving(false);
      navigate("/", { replace: true });
    }
  };

  const skip = async () => {
    posthog.capture("onboarding.skipped", { step: currentStep });
    await markOnboardingComplete();
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4 font-sans">
      {/* Card */}
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100 dark:bg-slate-800">
          <motion.div
            className="h-full bg-primary-500"
            animate={{ width: `${((stepIdx + 1) / STEPS.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Body */}
        <div className="p-6 min-h-[420px] flex flex-col">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={currentStep}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="flex-1 flex flex-col"
            >
              {currentStep === "store" && (
                <StoreStep
                  storeName={storeName}
                  setStoreName={setStoreName}
                  storePhone={storePhone}
                  setStorePhone={setStorePhone}
                />
              )}
              {currentStep === "details" && (
                <DetailsStep
                  storeAddress={storeAddress}
                  setStoreAddress={setStoreAddress}
                  storeGSTIN={storeGSTIN}
                  setStoreGSTIN={setStoreGSTIN}
                  gstinError={gstinError}
                />
              )}
              {currentStep === "done" && <DoneStep />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          {stepIdx > 0 && currentStep !== "done" ? (
            <Button variant="ghost" size="sm" onClick={() => go(-1)} className="text-slate-400">
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
          ) : (
            <button
              type="button"
              onClick={skip}
              className="text-sm text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Skip for now
            </button>
          )}

          {currentStep === "done" ? (
            <Button
              onClick={saveAndFinish}
              disabled={saving}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 gap-2 rounded-xl"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Explore the App
            </Button>
          ) : isLastDataStep ? (
            <Button
              onClick={() => go(1)}
              disabled={!!gstinError}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 gap-1.5 rounded-xl"
            >
              Next <ArrowRight size={16} />
            </Button>
          ) : (
            <Button
              onClick={() => go(1)}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 gap-1.5 rounded-xl"
            >
              Next <ArrowRight size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Step dots */}
      <div className="flex gap-1.5 mt-5">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === stepIdx
                ? "w-5 h-2 bg-primary-500"
                : i < stepIdx
                ? "w-2 h-2 bg-primary-300"
                : "w-2 h-2 bg-slate-300 dark:bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Step components ────────────────────────────────────────────────────────

function StoreStep({
  storeName, setStoreName,
  storePhone, setStorePhone,
}: {
  storeName: string; setStoreName: (v: string) => void;
  storePhone: string; setStorePhone: (v: string) => void;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-6">
        <div className="size-12 bg-primary-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
          <Building2 size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Set up your store</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          This helps personalise your invoices and reports.
        </p>
      </div>
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <Label htmlFor="ob-name">Store / Business Name</Label>
          <div className="relative">
            <Building2 size={15} className="absolute left-3 top-3 text-slate-400" />
            <Input
              id="ob-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="e.g. Mobile Zone Hyderabad"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-phone">Business Phone <span className="text-slate-400 font-normal">(optional)</span></Label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
            <Input
              id="ob-phone"
              type="tel"
              value={storePhone}
              onChange={(e) => setStorePhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailsStep({
  storeAddress, setStoreAddress,
  storeGSTIN, setStoreGSTIN,
  gstinError,
}: {
  storeAddress: string; setStoreAddress: (v: string) => void;
  storeGSTIN: string; setStoreGSTIN: (v: string) => void;
  gstinError: string | null;
}) {
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-6">
        <div className="size-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-4">
          <FileText size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">A few more details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Shown on invoices and GST reports. You can update these any time in Profile.
        </p>
      </div>
      <div className="space-y-4 flex-1">
        <div className="space-y-1.5">
          <Label htmlFor="ob-address">Store Address <span className="text-slate-400 font-normal">(optional)</span></Label>
          <div className="relative">
            <MapPin size={15} className="absolute left-3 top-3 text-slate-400" />
            <textarea
              id="ob-address"
              value={storeAddress}
              onChange={(e) => setStoreAddress(e.target.value)}
              placeholder="Full address with city, state, and pincode"
              rows={3}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/40 placeholder:text-slate-400"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ob-gstin">GSTIN <span className="text-slate-400 font-normal">(optional)</span></Label>
          <Input
            id="ob-gstin"
            value={storeGSTIN}
            onChange={(e) => setStoreGSTIN(e.target.value.toUpperCase())}
            placeholder="22AAAAA0000A1Z5"
            maxLength={15}
            className="font-mono tracking-wider"
          />
          {storeGSTIN.length > 0 && (
            gstinError
              ? <p className="text-xs text-amber-500 font-semibold mt-1">{gstinError}</p>
              : <p className="text-xs text-emerald-500 font-semibold mt-1">Valid GSTIN ✓</p>
          )}
        </div>
      </div>
    </div>
  );
}

function DoneStep() {
  const features = [
    { icon: "📦", label: "Inventory", desc: "Track every device in real time" },
    { icon: "🧾", label: "Orders", desc: "Create sales and purchase orders" },
    { icon: "📊", label: "Ledger", desc: "Monitor your P&L and cash flow" },
    { icon: "👥", label: "Customers", desc: "Manage your buyer & supplier network" },
  ];
  return (
    <div className="flex-1 flex flex-col">
      <div className="mb-5 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">You're all set!</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Here's a quick look at what you can do.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {features.map((f) => (
          <div
            key={f.label}
            className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 flex flex-col gap-1"
          >
            <span className="text-xl">{f.icon}</span>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{f.label}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">{f.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
