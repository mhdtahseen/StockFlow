import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/app/hooks";
import {
  addCustomerPayment,
  addCustomerSettlement,
} from "@/features/customers/slice";
import {
  addSupplierSettlement,
  addSupplierPayment,
} from "@/features/purchasing/slice";
import type { PayMode } from "@/features/billing/types";
import CurrencyInput from "@/components/ui/CurrencyInput";
import clsx from "clsx";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Banknote, QrCode, Landmark, ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId?: string;
  counterpartyId: string;
  currentAmountPaid: number;
  totalAmount: number;
  type: "AR" | "AP";
}

export function RecordPaymentSheet({
  open,
  onOpenChange,
  orderId,
  counterpartyId,
  currentAmountPaid,
  totalAmount,
  type,
}: Props) {
  const max = totalAmount - currentAmountPaid;
  const [amountStr, setAmountStr] = useState(max.toString());
  const [mode, setMode] = useState<Exclude<PayMode, "CREDIT">>("CASH");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  React.useEffect(() => {
    if (open) { setAmountStr(max.toString()); setIsSubmitting(false); }
  }, [open, max]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    const amount = parseFloat(amountStr) || 0;
    if (amount <= 0 || amount > max)
      return toast.error(`Invalid amount max is ${max}`);

    setIsSubmitting(true);
    const paymentId = crypto.randomUUID();

    const structuredNote = undefined;

    if (type === "AR") {
      if (orderId) {
        dispatch(
          addCustomerPayment({
            id: paymentId,
            counterpartyId,
            totalReceived: amount,
            mode,
            receivedAt: new Date().toISOString(),
            recordedBy: user?.id || "system",
            note: structuredNote,
            allocations: [{ saleOrderId: orderId, amountAllocated: amount }],
          }),
        );
        toast.success("Order Payment Recorded");
      } else {
        dispatch(
          addCustomerSettlement({
            id: paymentId,
            counterpartyId,
            amount,
            mode,
            allocations: [], // Bulk/Unallocated initially
            recordedBy: user?.id || "system",
            note: structuredNote,
          }),
        );
        toast.success("Collection Dispatched (AR)");
      }
    } else {
      if (orderId) {
        dispatch(
          addSupplierPayment({
            id: paymentId,
            counterpartyId,
            totalPaid: amount,
            mode,
            paidAt: new Date().toISOString(),
            recordedBy: user?.id || "system",
            note: structuredNote,
            allocations: [
              { purchaseOrderId: orderId, amountAllocated: amount },
            ],
          }),
        );
        toast.success("Supplier Payment Dispatched");
      } else {
        dispatch(
          addSupplierSettlement({
            id: paymentId,
            counterpartyId,
            amount,
            mode,
            allocations: [],
            recordedBy: user?.id || "system",
            note: structuredNote,
          }),
        );
        toast.success("Supplier Bulk Settlement Dispatched");
      }
    }
    onOpenChange(false);
  };

  const PAY_MODES: { value: Exclude<PayMode, "CREDIT">; label: string; icon: React.ReactNode }[] = [
    { value: "CASH",          label: "Cash",         icon: <Banknote  size={18} /> },
    { value: "UPI",           label: "UPI",          icon: <QrCode    size={18} /> },
    { value: "BANK_TRANSFER", label: "Bank",         icon: <Landmark  size={18} /> },
  ];

  const isAR = type === "AR";
  const paidPct = totalAmount > 0 ? Math.min((currentAmountPaid / totalAmount) * 100, 100) : 0;
  const enteredAmount = parseFloat(amountStr) || 0;
  const afterPayment = Math.min(currentAmountPaid + enteredAmount, totalAmount);
  const afterPct = totalAmount > 0 ? Math.min((afterPayment / totalAmount) * 100, 100) : 0;
  const willSettle = afterPayment >= totalAmount;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-0 pt-0 pb-safe-bottom"
      >
        {/* Header */}
        <div className={clsx(
          "flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800",
        )}>
          <div className={clsx(
            "size-10 rounded-2xl flex items-center justify-center shrink-0",
            isAR
              ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-100 dark:bg-rose-900/30 text-rose-500 dark:text-rose-400",
          )}>
            {isAR ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
          </div>
          <div>
            <SheetTitle className="text-base font-black text-slate-900 dark:text-white leading-tight">
              {isAR ? "Record Collection" : "Record Payment"}
            </SheetTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isAR ? "Customer → You" : "You → Supplier"}
              {orderId && (
                <span className="ml-2 px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono text-[10px]">
                  #{orderId.slice(0, 8).toUpperCase()}
                </span>
              )}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pt-5 pb-6 flex flex-col gap-5">
          {/* Balance summary */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4 pb-3">
              <div className="space-y-0.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Order Total
                </p>
                <p className="text-base font-black text-slate-700 dark:text-slate-200">
                  ₹{totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
              <div className="text-right space-y-0.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  Remaining
                </p>
                <p className={clsx(
                  "text-2xl font-black leading-none",
                  max === 0 ? "text-emerald-500" : "text-rose-500",
                )}>
                  ₹{max.toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="px-5 pb-4">
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                {/* Already paid */}
                <div
                  className="h-full rounded-full bg-emerald-400 dark:bg-emerald-500 transition-all duration-300 relative"
                  style={{ width: `${afterPct}%` }}
                >
                  {/* Ghost overlay showing what THIS payment covers */}
                  {enteredAmount > 0 && afterPct > paidPct && (
                    <div
                      className={clsx(
                        "absolute right-0 top-0 h-full rounded-r-full",
                        willSettle ? "bg-emerald-600" : "bg-primary-500",
                      )}
                      style={{ width: `${((afterPct - paidPct) / afterPct) * 100}%` }}
                    />
                  )}
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-[10px] text-slate-400 font-semibold">
                  {currentAmountPaid > 0 && `₹${currentAmountPaid.toLocaleString("en-IN")} paid`}
                </span>
                <span className={clsx(
                  "text-[10px] font-bold",
                  willSettle && enteredAmount > 0
                    ? "text-emerald-500"
                    : "text-slate-400",
                )}>
                  {willSettle && enteredAmount > 0
                    ? "Fully Settled ✓"
                    : enteredAmount > 0
                    ? `₹${afterPayment.toLocaleString("en-IN")} after this payment`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Pay mode */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2.5 block">
              Payment Method
            </label>
            <div className="grid grid-cols-3 gap-2">
              {PAY_MODES.map(({ value, label, icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setMode(value)}
                  className={clsx(
                    "flex flex-col items-center gap-1.5 py-3 rounded-2xl border font-bold text-xs transition-all",
                    mode === value
                      ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-primary-500/25"
                      : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400",
                  )}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">
                Amount (₹)
              </label>
              {max > 0 && (
                <button
                  type="button"
                  onClick={() => setAmountStr(max.toString())}
                  className="text-[10px] font-black uppercase tracking-widest text-primary-500 hover:text-primary-600 transition-colors px-2 py-1 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  Full Amount
                </button>
              )}
            </div>
            <CurrencyInput
              value={amountStr}
              onChange={setAmountStr}
              autoFocus={false}
              className="h-14 text-xl! font-black! rounded-2xl"
              placeholder="0"
            />
          </div>

          {/* Submit */}
          <Button
            type="submit"
            disabled={enteredAmount <= 0 || enteredAmount > max || isSubmitting}
            className={clsx(
              "w-full h-14 rounded-2xl text-base font-black tracking-wide text-white shadow-lg transition-all",
              willSettle && enteredAmount > 0
                ? "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25"
                : "bg-primary-500 hover:bg-primary-600 shadow-primary-500/25",
            )}
          >
            {willSettle && enteredAmount > 0
              ? `Settle · ₹${enteredAmount.toLocaleString("en-IN")}`
              : enteredAmount > 0
              ? `${isAR ? "Collect" : "Pay"} · ₹${enteredAmount.toLocaleString("en-IN")}`
              : isAR ? "Collect Payment" : "Record Payment"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
