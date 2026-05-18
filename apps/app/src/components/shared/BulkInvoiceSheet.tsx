import React, { useState, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, FileStack, Files } from "lucide-react";
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

  async function handleGenerate() {
    if (tooMany || generating) return;
    abortRef.current = new AbortController();
    setGenerating(true);
    setProgress(0);

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
      toast.success(
        mode === "combined"
          ? `Combined PDF generated (${orders.length} ${docLabel.toLowerCase()}s)`
          : `${orders.length} PDFs zipped`,
      );
      onOpenChange(false);
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
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-lg font-black">
            Generate Bulk {docLabel}s
          </SheetTitle>
        </SheetHeader>

        {/* Order count summary */}
        <div className="mb-6 px-4 py-3 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Selected {docLabel.toLowerCase()}s
          </span>
          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
            {orders.length}
          </span>
        </div>

        {tooMany && (
          <div className="mb-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs font-semibold text-amber-700 dark:text-amber-400">
            Maximum {MAX_ORDERS} orders at a time. Please deselect some orders.
          </div>
        )}

        {/* Format options */}
        <div className="space-y-3 mb-6">
          {(
            [
              {
                value: "combined" as BulkInvoiceMode,
                icon: <FileStack size={20} />,
                label: "Combined PDF",
                desc: "All invoices in one file with page breaks",
              },
              {
                value: "individual" as BulkInvoiceMode,
                icon: <Files size={20} />,
                label: "Individual PDFs",
                desc: `One PDF per ${docLabel.toLowerCase()}, zipped together`,
              },
            ] as const
          ).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMode(opt.value)}
              disabled={generating}
              className={clsx(
                "w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all",
                mode === opt.value
                  ? "border-primary-500 bg-primary-50 dark:bg-primary-500/10"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
              )}
            >
              <div
                className={clsx(
                  "size-10 rounded-xl flex items-center justify-center shrink-0",
                  mode === opt.value
                    ? "bg-primary-500 text-white"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500",
                )}
              >
                {opt.icon}
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-slate-100">
                  {opt.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {opt.desc}
                </p>
              </div>
              <div
                className={clsx(
                  "ml-auto size-5 rounded-full border-2 flex items-center justify-center shrink-0",
                  mode === opt.value
                    ? "border-primary-500 bg-primary-500"
                    : "border-slate-300 dark:border-slate-600",
                )}
              >
                {mode === opt.value && (
                  <div className="size-2 rounded-full bg-white" />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        {generating && (
          <div className="mb-4 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <span>Generating…</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {generating ? (
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          ) : (
            <Button
              variant="outline"
              className="flex-1 rounded-2xl"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
          <Button
            className="flex-1 rounded-2xl bg-primary-500 hover:bg-primary-600 text-white font-bold"
            onClick={handleGenerate}
            disabled={generating || tooMany}
          >
            {generating ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                Generating…
              </>
            ) : (
              `Generate ${mode === "combined" ? "PDF" : "ZIPs"}`
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
