/**
 * ConnectSheet — "Scan to Connect" bottom sheet.
 *
 * Opens with an optional pre-filled tradeCode (from QR scan or deep link).
 * 1. Resolves the business name via lookup_tenant_by_trade_code.
 * 2. User picks how they classify this business (their type).
 * 3. Calls connect_by_trade_code → mutual counterparty creation.
 * 4. Dispatches addCustomer to Redux so the new contact appears immediately.
 */
import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { addCustomer, updateCustomerLink } from "@/features/customers/slice";
import { lookupTenantByTradeCode, connectByTradeCode } from "@/app/supabaseApi";
import { toast } from "sonner";
import {
  Building2,
  CheckCircle2,
  Search,
  Loader2,
  Link2,
  Users,
  ShoppingCart,
  Store,
  ScanLine,
} from "lucide-react";
import clsx from "clsx";
import type { CustomerType } from "@/features/customers/types";
import QrScannerModal from "@/components/shared/QrScannerModal";

// ── type-inversion map: if I call them X, they should call me Y ──────────────
const INVERSE_TYPE: Record<string, string> = {
  CUSTOMER:   "WHOLESALER",
  WHOLESALER: "CUSTOMER",
  RETAILER:   "RETAILER",
  PLATFORM:   "RETAILER",
};

interface TypeOption {
  value: CustomerType;
  label: string;
  sub: string;
  icon: React.ReactNode;
  color: string;
}

const TYPE_OPTIONS: TypeOption[] = [
  {
    value: "WHOLESALER",
    label: "Supplier / Wholesaler",
    sub: "They supply stock to me",
    icon: <ShoppingCart size={18} />,
    color: "border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
  },
  {
    value: "CUSTOMER",
    label: "Customer / Buyer",
    sub: "I supply stock to them",
    icon: <Users size={18} />,
    color: "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400",
  },
  {
    value: "RETAILER",
    label: "Retailer / Peer",
    sub: "We trade with each other",
    icon: <Store size={18} />,
    color: "border-violet-300 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400",
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCode?: string; // pre-filled from QR scan or deep link
}

export function ConnectSheet({ open, onOpenChange, initialCode }: Props) {
  const dispatch = useAppDispatch();
  const existingCustomers = useAppSelector((s) => s.customers.customers);

  const [code, setCode] = useState(initialCode ?? "");
  const [resolvedName, setResolvedName] = useState<string | null>(null);
  const [resolvedTenantId, setResolvedTenantId] = useState<string | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [selectedType, setSelectedType] = useState<CustomerType | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Reset when sheet opens/closes
  useEffect(() => {
    if (open) {
      setCode(initialCode ?? "");
      setResolvedName(null);
      setResolvedTenantId(null);
      setSelectedType(null);
      setConnecting(false);
      // Auto-lookup if pre-filled
      if (initialCode && initialCode.length === 6) {
        handleLookup(initialCode);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialCode]);

  const handleLookup = async (lookupCode: string) => {
    if (!lookupCode || lookupCode.length !== 6 || lookingUp) return;
    setLookingUp(true);
    setResolvedName(null);
    setResolvedTenantId(null);
    try {
      const result = await lookupTenantByTradeCode(lookupCode);
      if (result.found) {
        setResolvedName(result.name ?? null);
        setResolvedTenantId(result.tenant_id ?? null);
      } else {
        toast.error("No Finventree business found with that Trade Code");
      }
    } catch (err: any) {
      toast.error(err.message || "Lookup failed");
    } finally {
      setLookingUp(false);
    }
  };

  const handleConnect = async () => {
    if (!resolvedName || !selectedType || connecting) return;
    setConnecting(true);
    try {
      const inverseType = INVERSE_TYPE[selectedType] ?? "RETAILER";
      const result = await connectByTradeCode(code, selectedType, inverseType);

      if (result.alreadyConnected) {
        toast.info(`Already connected to "${result.theirName}"`);
        onOpenChange(false);
        return;
      }

      // Check if this counterparty is already in Redux (was unlinked and just re-linked)
      const existing = existingCustomers.find((c) => c.id === result.counterpartyId);
      
      if (existing) {
        dispatch(updateCustomerLink({
          id: result.counterpartyId,
          linkedTenantId: resolvedTenantId ?? undefined,
          linkedTenantName: result.theirName
        }));
      } else {
        // Add the new counterparty to Redux so it appears immediately
        dispatch(addCustomer({
          id: result.counterpartyId,
          name: result.theirName,
          type: selectedType,
          linkedTenantId: resolvedTenantId ?? undefined,
          linkedTenantName: result.theirName,
          createdAt: new Date().toISOString(),
        }));
      }

      toast.success(`Connected with "${result.theirName}"! They now appear in your contacts.`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Connection failed");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-safe-area-inset-bottom max-h-[90vh] overflow-y-auto">
        {/* Drag handle */}
        <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mt-3 mb-1" />

        <SheetTitle className="sr-only">Connect with a Business</SheetTitle>

        <div className="px-5 pb-8 pt-4 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
              <Link2 size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                Connect with a Business
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Enter their 6-character Trade Code
              </p>
            </div>
          </div>

          {/* Trade Code entry */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Trade Code
            </label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z2-9]/g, "").slice(0, 6);
                  setCode(v);
                  if (v.length < 6) {
                    setResolvedName(null);
                    setResolvedTenantId(null);
                  }
                }}
                placeholder="AB3K7Z"
                className="font-mono text-xl tracking-[0.3em] text-center uppercase h-14 text-slate-900 dark:text-slate-100"
                maxLength={6}
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-14 w-14 shrink-0"
                onClick={() => setScannerOpen(true)}
                title="Scan QR code"
              >
                <ScanLine size={18} />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-14 w-14 shrink-0"
                disabled={code.length !== 6 || lookingUp}
                onClick={() => handleLookup(code)}
              >
                {lookingUp ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
              </Button>
            </div>

            {/* Resolved business name */}
            {resolvedName && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    {resolvedName}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-500">
                    Verified Finventree Business
                  </p>
                </div>
                <Building2 size={14} className="text-emerald-500 ml-auto shrink-0" />
              </div>
            )}
          </div>

          {/* Relationship type picker — only shown after successful lookup */}
          {resolvedName && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                What is your relationship with {resolvedName}?
              </label>
              <div className="space-y-2">
                {TYPE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSelectedType(opt.value)}
                    className={clsx(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all text-left",
                      selectedType === opt.value
                        ? opt.color
                        : "border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300",
                    )}
                  >
                    <span className="shrink-0">{opt.icon}</span>
                    <div>
                      <p className="text-sm font-bold leading-tight">{opt.label}</p>
                      <p className="text-[11px] opacity-70 mt-0.5">{opt.sub}</p>
                    </div>
                    {selectedType === opt.value && (
                      <CheckCircle2 size={16} className="ml-auto shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Connect button */}
          {resolvedName && (
            <Button
              className="w-full h-13 font-black text-sm rounded-2xl"
              disabled={!selectedType || connecting}
              onClick={handleConnect}
            >
              {connecting ? (
                <Loader2 size={16} className="animate-spin mr-2" />
              ) : (
                <Link2 size={16} className="mr-2" />
              )}
              {connecting ? "Connecting…" : `Connect with ${resolvedName}`}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>

    <QrScannerModal
      isOpen={scannerOpen}
      onClose={() => setScannerOpen(false)}
      onScan={(scanned) => {
        setScannerOpen(false);
        setCode(scanned);
        handleLookup(scanned);
      }}
      onManualEntry={() => setScannerOpen(false)}
    />
    </>
  );
}
