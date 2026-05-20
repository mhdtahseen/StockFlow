import React, { useState, useRef } from "react";
import { Capacitor } from "@capacitor/core";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Loader2, FileStack, Files, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import clsx from "clsx";
import { generateBulkInvoice, type BulkInvoiceMode } from "@/utils/bulkInvoice";
import type { SaleOrder } from "@/features/billing/types";
import type { PurchaseOrder } from "@/features/purchasing/types";
import type { Customer } from "@/features/customers/types";
import type { TenantInfo } from "@/context/AuthContext";

const MAX_ORDERS = 50;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orders: Array<SaleOrder | PurchaseOrder>;
  counterpartyMap: Record<string, Customer>;
  tenant: TenantInfo | null;
  isPurchaseOrder: boolean;
}

export function BulkInvoiceSheet({
  open,
  onOpenChange,
  orders,
  counterpartyMap,
  tenant,
  isPurchaseOrder,
}: Props) {
  const [mode, setMode] = useState<BulkInvoiceMode>("combined");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const docLabel = isPurchaseOrder ? "PO" : "Invoice";
  const tooMany = orders.length > MAX_ORDERS;

  const isNative = Capacitor.isNativePlatform();

  async function handleGenerate() {
    if (tooMany || generating) return;
    abortRef.current = new AbortController();
    setGenerating(true);
    setProgress(0);

    // On native, close sheet first so html2canvas doesn't pick up the overlay.
    // On web individual mode, also close (uses html2canvas for ZIP generation).
    // On web combined mode, we open a new window so the sheet doesn't interfere.
    if (isNative || mode === "individual") {
      onOpenChange(false);
      await new Promise((r) => setTimeout(r, 400));
    }

    try {
      await generateBulkInvoice({
        orders,
        counterpartyMap,
        tenant,
        isPurchaseOrder,
        mode,
        signal: abortRef.current.signal,
        onProgress: (current, total) =>
          setProgress(Math.round((current / total) * 100)),
      });
      if (isNative) {
        toast.success(
          mode === "combined"
            ? `Combined PDF generated (${orders.length} ${docLabel.toLowerCase()}s)`
            : `${orders.length} PDFs zipped`,
        );
      } else if (mode === "individual") {
        toast.success(`ZIP downloaded with ${orders.length} PDFs`);
      } else {
        // On web combined: print dialog opened; close the sheet
        onOpenChange(false);
      }
    } catch (err: any) {
      if (abortRef.current?.signal.aborted) {
        toast.info("Generation cancelled");
      } else {
        toast.error(err?.message || "Failed to generate invoices");
      }
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  }

  function handleCancel() {
    abortRef.current?.abort();
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!generating) onOpenChange(o); }}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-0"
      >
        {/* ── Header ── */}
        <SheetHeader className="flex flex-row items-center gap-3 px-6 pt-6 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="size-10 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0">
            <FileStack size={20} className="text-primary-500" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <SheetTitle className="text-base font-black text-slate-900 dark:text-white leading-tight">
              Generate Bulk {docLabel}s
            </SheetTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {orders.length} {docLabel.toLowerCase()}{orders.length !== 1 ? "s" : ""} selected
            </p>
          </div>
        </SheetHeader>

        <div className="px-6 pt-5 pb-6 space-y-5">
          {/* ── Too-many warning ── */}
          {tooMany && (
            <div className="flex items-start gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl">
              <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 leading-snug">
                Maximum {MAX_ORDERS} orders at a time. Please deselect some.
              </p>
            </div>
          )}

          {/* ── Output format ── */}
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
              Output Format
            </p>
            <div className="space-y-2.5">
              {(
                [
                  {
                    value: "combined" as BulkInvoiceMode,
                    icon: <FileStack size={18} />,
                    label: "Combined PDF",
                    desc: "All invoices in one file with page breaks",
                  },
                  {
                    value: "individual" as BulkInvoiceMode,
                    icon: <Files size={18} />,
                    label: "Individual PDFs",
                    desc: `One PDF per ${docLabel.toLowerCase()}, zipped together`,
                  },
                ] as const
              ).map((opt) => {
                const selected = mode === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setMode(opt.value)}
                    disabled={generating}
                    className={clsx(
                      "w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border-2 text-left transition-all",
                      selected
                        ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                        : "border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700",
                    )}
                  >
                    <div
                      className={clsx(
                        "size-9 rounded-xl flex items-center justify-center shrink-0",
                        selected
                          ? "bg-primary-500 text-white"
                          : "bg-white dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      {opt.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={clsx(
                        "text-sm font-bold leading-tight",
                        selected ? "text-primary-600 dark:text-primary-400" : "text-slate-800 dark:text-slate-100",
                      )}>
                        {opt.label}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                        {opt.desc}
                      </p>
                    </div>
                    {/* Radio dot */}
                    <div
                      className={clsx(
                        "size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
                        selected
                          ? "border-primary-500 bg-primary-500"
                          : "border-slate-300 dark:border-slate-600",
                      )}
                    >
                      {selected && <div className="size-2 rounded-full bg-white" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Progress ── */}
          {generating && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl px-4 py-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Loader2 size={13} className="animate-spin text-primary-500" />
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    Generating…
                  </span>
                </div>
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 tabular-nums">
                  {progress}%
                </span>
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold border-slate-200 dark:border-slate-800"
              onClick={generating ? handleCancel : () => onOpenChange(false)}
            >
              {generating ? "Cancel" : "Close"}
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold shadow-sm"
              onClick={handleGenerate}
              disabled={generating || tooMany}
            >
              {generating ? (
                <span className="opacity-0">Generate</span>
              ) : (
                `Generate ${mode === "combined" ? "PDF" : "ZIPs"}`
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
