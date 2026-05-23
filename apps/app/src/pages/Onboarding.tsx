import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2, Phone, MapPin, FileText, Sparkles, ArrowRight, ArrowLeft,
  Loader2, User, Mail, Sun, Moon, Monitor, Bell, CheckCircle2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { isValidGstin } from "@/utils/gstCalc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import LogoUpload from "@/components/ui/LogoUpload";
import posthog from "@/lib/posthog";
import clsx from "clsx";

const SLIDE_VARIANTS = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
};

const TRANSITION = { duration: 0.22, ease: "easeOut" as const };

type StepId = "owner" | "business" | "preferences";
const STEPS: StepId[] = ["owner", "business", "preferences"];

/** Maps first 2 digits of GSTIN to Indian state code */
function stateFromGstin(gstin: string): string | null {
  const map: Record<string, string> = {
    "01": "J&K", "02": "HP", "03": "PB", "04": "CH", "05": "UT",
    "06": "HR", "07": "DL", "08": "RJ", "09": "UP", "10": "BR",
    "11": "SK", "12": "AR", "13": "NL", "14": "MN", "15": "MZ",
    "16": "TR", "17": "ML", "18": "AS", "19": "WB", "20": "JH",
    "21": "OD", "22": "CG", "23": "MP", "24": "GJ", "26": "DD",
    "27": "MH", "28": "AP", "29": "KA", "30": "GA", "31": "LD",
    "32": "KL", "33": "TN", "34": "PY", "35": "AN", "36": "TS",
    "37": "AP",
  };
  return map[gstin.slice(0, 2)] ?? null;
}

export default function Onboarding() {
  const navigate = useNavigate();
  const { tenant, user, markOnboardingComplete } = useAuth();
  const { mode, setMode } = useTheme();
  const { togglePushNotifications } = usePushNotifications();

  const [stepIdx, setStepIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [saving, setSaving] = useState(false);

  // ── Step 1: Owner ──────────────────────────────────────────────────────────
  const [logoUrl, setLogoUrl] = useState(tenant?.logoUrl ?? "");
  const [ownerPhone, setOwnerPhone] = useState(tenant?.phone ?? "");

  // ── Step 2: Business ──────────────────────────────────────────────────────
  const [storeName, setStoreName] = useState(tenant?.name ?? "");
  const [storeGSTIN, setStoreGSTIN] = useState(tenant?.gstin ?? "");
  const [storeAddress, setStoreAddress] = useState(tenant?.address ?? "");

  // ── Step 3: Preferences ───────────────────────────────────────────────────
  const [notifsEnabled, setNotifsEnabled] = useState(
    typeof Notification !== "undefined" && Notification.permission === "granted",
  );

  const currentStep = STEPS[stepIdx];

  const gstinError =
    storeGSTIN.length > 0 && storeGSTIN.length !== 15
      ? "GSTIN must be 15 characters"
      : storeGSTIN.length === 15 && !isValidGstin(storeGSTIN)
      ? "Invalid GSTIN format"
      : null;

  const derivedStateCode = storeGSTIN.length === 15 && !gstinError
    ? stateFromGstin(storeGSTIN)
    : null;

  const go = (delta: number) => {
    setDir(delta);
    setStepIdx((i) => i + delta);
  };

  const handleTogglePush = async (checked: boolean) => {
    setNotifsEnabled(checked);
    const success = await togglePushNotifications(checked);
    if (!success && checked) setNotifsEnabled(false);
  };

  const saveAndFinish = async () => {
    setSaving(true);
    posthog.capture("onboarding.completed");
    try {
      if (tenant?.id) {
        const updates: Record<string, string | null> = {};
        if (storeName.trim())                       updates.name        = storeName.trim();
        if (ownerPhone.trim())                      updates.phone       = ownerPhone.trim();
        if (storeAddress.trim())                    updates.address     = storeAddress.trim();
        if (storeGSTIN.trim() && !gstinError)       updates.gstin       = storeGSTIN.trim().toUpperCase();
        if (logoUrl)                                updates.logo_url    = logoUrl;
        if (derivedStateCode)                       updates.state_code  = derivedStateCode;
        if (Object.keys(updates).length > 0) {
          await supabase.from("tenants").update(updates).eq("id", tenant.id);
        }
      }
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

  const canAdvanceFromBusiness = !gstinError;

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

        {/* Step label */}
        <div className="px-6 pt-4 pb-0">
          <p className="text-[10px] font-bold text-primary-500 uppercase tracking-widest">
            Step {stepIdx + 1} of {STEPS.length}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 pb-0 pt-4 flex flex-col">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={currentStep}
              custom={dir}
              variants={SLIDE_VARIANTS}
              initial="enter"
              animate="center"
              exit="exit"
              transition={TRANSITION}
              className="flex flex-col"
            >
              {currentStep === "owner" && (
                <OwnerStep
                  email={user?.email ?? ""}
                  phone={ownerPhone}
                  setPhone={setOwnerPhone}
                  logoUrl={logoUrl}
                  setLogoUrl={setLogoUrl}
                />
              )}
              {currentStep === "business" && (
                <BusinessStep
                  storeName={storeName}
                  setStoreName={setStoreName}
                  storeGSTIN={storeGSTIN}
                  setStoreGSTIN={setStoreGSTIN}
                  gstinError={gstinError}
                  derivedStateCode={derivedStateCode}
                  storeAddress={storeAddress}
                  setStoreAddress={setStoreAddress}
                />
              )}
              {currentStep === "preferences" && (
                <PreferencesStep
                  themeMode={mode}
                  setThemeMode={setMode}
                  notifsEnabled={notifsEnabled}
                  onToggleNotifs={handleTogglePush}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-5 flex items-center justify-between gap-3">
          {stepIdx > 0 ? (
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

          {currentStep === "preferences" ? (
            <Button
              onClick={saveAndFinish}
              disabled={saving}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-6 gap-2 rounded-xl"
            >
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Start Exploring
            </Button>
          ) : (
            <Button
              onClick={() => go(1)}
              disabled={currentStep === "business" && !canAdvanceFromBusiness}
              className="bg-primary-500 hover:bg-primary-600 text-white font-semibold px-5 gap-1.5 rounded-xl disabled:opacity-50"
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

// ─── Step 1: Owner Details ─────────────────────────────────────────────────

function OwnerStep({
  email, phone, setPhone, logoUrl, setLogoUrl,
}: {
  email: string;
  phone: string; setPhone: (v: string) => void;
  logoUrl: string; setLogoUrl: (v: string) => void;
}) {
  return (
    <div className="flex flex-col pb-2">
      <div className="mb-5">
        <div className="size-12 bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-3">
          <User size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Owner Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Your logo will appear on invoices.
        </p>
      </div>

      {/* Logo upload centered */}
      <div className="flex flex-col items-center mb-5">
        <LogoUpload value={logoUrl} onChange={setLogoUrl} />
      </div>

      <div className="space-y-4">
        {/* Email — read-only */}
        <div className="space-y-1.5">
          <Label htmlFor="ob-email">Email</Label>
          <div className="relative">
            <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
            <Input
              id="ob-email"
              type="email"
              value={email}
              readOnly
              className="pl-9 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default select-none"
            />
          </div>
        </div>

        {/* Phone — editable */}
        <div className="space-y-1.5">
          <Label htmlFor="ob-phone">
            Phone <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
            <Input
              id="ob-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="pl-9"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Business Details ──────────────────────────────────────────────

function BusinessStep({
  storeName, setStoreName,
  storeGSTIN, setStoreGSTIN,
  gstinError, derivedStateCode,
  storeAddress, setStoreAddress,
}: {
  storeName: string; setStoreName: (v: string) => void;
  storeGSTIN: string; setStoreGSTIN: (v: string) => void;
  gstinError: string | null;
  derivedStateCode: string | null;
  storeAddress: string; setStoreAddress: (v: string) => void;
}) {
  return (
    <div className="flex flex-col pb-2">
      <div className="mb-5">
        <div className="size-12 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mb-3">
          <Building2 size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Business Details</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Shown on invoices and GST reports. Editable any time in Profile.
        </p>
      </div>

      <div className="space-y-4">
        {/* Business name */}
        <div className="space-y-1.5">
          <Label htmlFor="ob-name">Shop / Business Name</Label>
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

        {/* GSTIN */}
        <div className="space-y-1.5">
          <Label htmlFor="ob-gstin">
            GSTIN <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
          <div className="relative">
            <FileText size={15} className="absolute left-3 top-3 text-slate-400" />
            <Input
              id="ob-gstin"
              value={storeGSTIN}
              onChange={(e) => setStoreGSTIN(e.target.value.toUpperCase())}
              placeholder="29AAAAA0000A1Z5"
              maxLength={15}
              className="pl-9 font-mono tracking-wider"
            />
          </div>
          {storeGSTIN.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {gstinError ? (
                <p className="text-xs text-amber-500 font-semibold">{gstinError}</p>
              ) : (
                <>
                  <p className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={12} /> Valid GSTIN
                  </p>
                  {derivedStateCode && (
                    <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                      {derivedStateCode}
                    </span>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Address */}
        <div className="space-y-1.5">
          <Label htmlFor="ob-address">
            Shop Address <span className="text-slate-400 font-normal">(optional)</span>
          </Label>
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
      </div>
    </div>
  );
}

// ─── Step 3: App Preferences ───────────────────────────────────────────────

const THEME_OPTIONS: {
  value: "light" | "dark" | "system";
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "light",  label: "Light",  icon: <Sun  size={18} /> },
  { value: "dark",   label: "Dark",   icon: <Moon size={18} /> },
  { value: "system", label: "System", icon: <Monitor size={18} /> },
];

function PreferencesStep({
  themeMode, setThemeMode, notifsEnabled, onToggleNotifs,
}: {
  themeMode: "light" | "dark" | "system";
  setThemeMode: (v: "light" | "dark" | "system") => void;
  notifsEnabled: boolean;
  onToggleNotifs: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col pb-2">
      <div className="mb-5">
        <div className="size-12 bg-violet-50 dark:bg-violet-950 text-violet-600 dark:text-violet-400 rounded-2xl flex items-center justify-center mb-3">
          <Sparkles size={24} />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">App Preferences</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customise how the app looks and behaves. Change any time in Settings.
        </p>
      </div>

      <div className="space-y-5">
        {/* Theme */}
        <div className="space-y-2">
          <Label>Appearance</Label>
          <div className="grid grid-cols-3 gap-2">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setThemeMode(opt.value)}
                className={clsx(
                  "flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-xs font-bold transition-all",
                  themeMode === opt.value
                    ? "border-primary-500 bg-primary-50 dark:bg-primary-950 text-primary-600 dark:text-primary-400"
                    : "border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200 dark:hover:border-slate-700",
                )}
              >
                {opt.icon}
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Push notifications */}
        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Bell size={15} className="text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Push Notifications</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Low-stock alerts, payment reminders</p>
            </div>
          </div>
          <Switch
            checked={notifsEnabled}
            onCheckedChange={onToggleNotifs}
          />
        </div>
      </div>
    </div>
  );
}

