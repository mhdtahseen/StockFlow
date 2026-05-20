import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { useAppSelector, useAppDispatch } from "@/app/hooks";
import { selectOrdersByCounterparty } from "@/features/billing/selectors";
import { selectCounterpartyAdvance } from "@/features/customers/selectors";
import { addCustomerSettlement } from "@/features/customers/slice";
import { updateOrderPayment } from "@/features/billing/slice";
import {
  addSupplierSettlement,
  addSupplierPayment,
  updatePOPayment,
} from "@/features/purchasing/slice";
import { useAuth } from "@/context/AuthContext";
import clsx from "clsx";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, CheckCircle2, Sparkles } from "lucide-react";

type Mode = "receipt" | "payout";
type PaymentMethod = "CASH" | "UPI" | "BANK_TRANSFER";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  counterpartyId: string;
  mode: Mode;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
];

export function PaymentAllocationSheet({
  open,
  onOpenChange,
  counterpartyId,
  mode,
}: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();

  // --- Data ---
  const saleOrders = useAppSelector(
    selectOrdersByCounterparty(counterpartyId),
  ).filter(
    (o) => o.status === "OPEN" || o.status === "PARTIAL",
  ).sort(
    (a, b) =>
      new Date(a.dueDate || a.createdAt).getTime() -
      new Date(b.dueDate || b.createdAt).getTime(),
  );

  const allPurchaseOrders = useAppSelector((state) => state.purchasing.orders);
  const purchaseOrders = useMemo(
    () =>
      allPurchaseOrders
        .filter(
          (o) =>
            o.counterpartyId === counterpartyId &&
            (o.status === "AWAITING_RECEIPT" ||
              o.status === "RECEIVED" ||
              o.status === "PARTIAL"),
        )
        .sort(
          (a, b) =>
            new Date(a.dueDate || a.createdAt).getTime() -
            new Date(b.dueDate || b.createdAt).getTime(),
        ),
    [allPurchaseOrders, counterpartyId],
  );

  const orders = mode === "receipt" ? saleOrders : purchaseOrders;

  // Existing advance credit for this counterparty
  const { arAdvance, apAdvance } = useAppSelector(
    selectCounterpartyAdvance(counterpartyId),
  );
  const existingAdvance = mode === "receipt" ? arAdvance : apAdvance;

  // --- Form state ---
  const [amountStr, setAmountStr] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");

  const maxOwed = orders.reduce(
    (sum, o) => sum + (o.totalAmount - o.amountPaid),
    0,
  );
  // Effective owed after existing advance
  const effectiveOwed = Math.max(0, maxOwed - existingAdvance);
  const rawAmount = parseFloat(amountStr) || 0;
  // Total to allocate = new cash + existing advance
  const totalAvailable = rawAmount + existingAdvance;
  // Any surplus over maxOwed becomes new advance
  const newAdvance = Math.max(0, totalAvailable - maxOwed);

  // FIFO waterfall allocation — funded by totalAvailable (advance + new cash)
  const allocations = useMemo(() => {
    let remaining = totalAvailable;
    return orders.map((o) => {
      const owed = o.totalAmount - o.amountPaid;
      const take = Math.min(owed, remaining);
      remaining -= take;
      return { orderId: o.id, owed, allocated: take };
    });
  }, [totalAvailable, orders]);

  const activeAllocations = allocations.filter((a) => a.allocated > 0);

  // Per-allocation: how much comes from existing advance vs new cash
  const cashAllocations = useMemo(() => {
    let advanceRemaining = existingAdvance;
    return allocations.map((a) => {
      const fromAdvance = Math.min(a.allocated, advanceRemaining);
      advanceRemaining -= fromAdvance;
      const fromCash = a.allocated - fromAdvance;
      return { ...a, fromAdvance, fromCash };
    });
  }, [allocations, existingAdvance]);

  const handleClose = () => {
    setAmountStr("");
    setMethod("CASH");
    onOpenChange(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rawAmount <= 0 && existingAdvance <= 0) return toast.error("Enter a valid amount");
    if (rawAmount <= 0 && existingAdvance > 0 && activeAllocations.length === 0)
      return toast.error("No pending orders to apply advance to");

    const paymentId = crypto.randomUUID();
    const now = new Date().toISOString();

    if (mode === "receipt") {
      // Only create a payment record if cash was entered
      if (rawAmount > 0) {
        dispatch(
          addCustomerSettlement({
            id: paymentId,
            counterpartyId,
            amount: rawAmount,
            mode: method,
            allocations: cashAllocations
              .filter((a) => a.fromCash > 0)
              .map((a) => ({ orderId: a.orderId, amount: a.fromCash })),
            recordedBy: user?.id || "system",
            note:
              newAdvance > 0
                ? `Receipt — ₹${newAdvance.toLocaleString()} held as advance`
                : `Receipt — FIFO Allocation`,
          }),
        );
      }
      activeAllocations.forEach((a) => {
        const order = orders.find((o) => o.id === a.orderId);
        if (order) {
          const newPaid = order.amountPaid + a.allocated;
          dispatch(
            updateOrderPayment({
              id: a.orderId,
              amountPaid: newPaid,
              status: newPaid >= order.totalAmount ? "SETTLED" : "PARTIAL",
            }),
          );
        }
      });
      toast.success(
        newAdvance > 0
          ? `Receipt recorded · ₹${newAdvance.toLocaleString()} held as advance`
          : "Receipt recorded",
      );
    } else {
      const settlementNote =
        newAdvance > 0
          ? `Paid — ₹${newAdvance.toLocaleString()} held as prepaid`
          : activeAllocations.length === 1
            ? `Paid #${activeAllocations[0].orderId.slice(0, 6).toUpperCase()}`
            : `Paid ${activeAllocations.length} order${activeAllocations.length !== 1 ? "s" : ""}`;

      if (rawAmount > 0) {
        dispatch(
          addSupplierSettlement({
            id: paymentId,
            counterpartyId,
            amount: rawAmount,
            mode: method,
            note: settlementNote,
          }),
        );
        dispatch(
          addSupplierPayment({
            id: paymentId,
            counterpartyId,
            totalPaid: rawAmount,
            mode: method as any,
            paidAt: now,
            note: settlementNote,
            recordedBy: user?.id || "system",
            allocations: cashAllocations
              .filter((a) => a.fromCash > 0)
              .map((a) => ({
                purchaseOrderId: a.orderId,
                amountAllocated: a.fromCash,
              })),
          }),
        );
      }
      activeAllocations.forEach((a) => {
        const order = orders.find((o) => o.id === a.orderId);
        if (order) {
          const newPaid = order.amountPaid + a.allocated;
          dispatch(
            updatePOPayment({
              id: a.orderId,
              amountPaid: newPaid,
              status: newPaid >= order.totalAmount ? "SETTLED" : "PARTIAL",
            }),
          );
        }
      });
      toast.success(
        newAdvance > 0
          ? `Payment recorded · ₹${newAdvance.toLocaleString()} held as prepaid`
          : "Payment recorded",
      );
    }
    handleClose();
  };

  // --- Theming ---
  const isReceipt = mode === "receipt";
  const accentBg = isReceipt ? "bg-emerald-500" : "bg-amber-500";
  const accentText = isReceipt
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-amber-600 dark:text-amber-400";
  const allocatedColor = isReceipt
    ? "text-emerald-600 dark:text-emerald-400"
    : "text-amber-600 dark:text-amber-400";
  const allocatedBg = isReceipt
    ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30"
    : "bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30";

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 h-[92vh] flex flex-col p-0"
      >
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div
              className={clsx(
                "size-9 rounded-full flex items-center justify-center shrink-0",
                isReceipt
                  ? "bg-emerald-50 dark:bg-emerald-900/30"
                  : "bg-amber-50 dark:bg-amber-900/30",
              )}
            >
              {isReceipt ? (
                <ArrowDownLeft size={18} className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <ArrowUpRight size={18} className="text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div>
              <SheetTitle className="text-left text-base font-black leading-tight">
                {isReceipt ? "Log Receipt" : "Log Payment"}
              </SheetTitle>
              <p className="text-[11px] font-semibold text-slate-400 mt-0.5">
                {isReceipt
                  ? "Record money received from this customer"
                  : "Record payment sent to this supplier"}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pt-4 pb-6 space-y-4">
          <form id="allocation-form" onSubmit={handleSubmit}>
            {/* Existing advance credit banner */}
            {existingAdvance > 0 && (
              <div className="flex items-center gap-3 px-4 py-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-900/40 rounded-xl mb-4">
                <Sparkles size={15} className="text-teal-600 dark:text-teal-400 shrink-0" />
                <div className="flex-1">
                  <p className="text-[11px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    ₹{existingAdvance.toLocaleString()} advance credit available
                  </p>
                  <p className="text-[10px] font-medium text-teal-600/70 dark:text-teal-500 mt-0.5">
                    Auto-applied to outstanding orders below
                  </p>
                </div>
                <span className="text-sm font-black text-teal-600 dark:text-teal-400 shrink-0">
                  −₹{Math.min(existingAdvance, maxOwed).toLocaleString()}
                </span>
              </div>
            )}

            {/* Amount + method card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mb-4">
              <div className={clsx("h-1 w-full", accentBg)} />
              <div className="p-4 space-y-4">
                {/* Outstanding */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {isReceipt ? "Outstanding receivable" : "Total payable"}
                  </span>
                  <div className="text-right">
                    {existingAdvance > 0 && maxOwed > 0 && (
                      <p className="text-[10px] font-bold text-teal-500 line-through">
                        ₹{maxOwed.toLocaleString()}
                      </p>
                    )}
                    <span className={clsx("text-lg font-black", accentText)}>
                      ₹{effectiveOwed.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    {isReceipt ? "Cash received" : "Cash paid"}
                    {existingAdvance > 0 && effectiveOwed > 0 && (
                      <span className="ml-1 font-medium normal-case text-slate-400">
                        (advance covers ₹{Math.min(existingAdvance, maxOwed).toLocaleString()})
                      </span>
                    )}
                  </label>
                  <CurrencyInput
                    value={amountStr}
                    onChange={setAmountStr}
                    size="lg"
                    autoFocus={existingAdvance === 0}
                  />
                  {newAdvance > 0 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-900/40 rounded-lg">
                      <Sparkles size={12} className="text-teal-500 shrink-0" />
                      <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
                        ₹{newAdvance.toLocaleString()} will be held as advance credit for the next order
                      </p>
                    </div>
                  )}
                </div>

                {/* Payment method */}
                {(rawAmount > 0 || existingAdvance === 0) && (
                  <div>
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                      Payment method
                    </label>
                    <div className="flex gap-2">
                      {PAYMENT_METHODS.map((m) => (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setMethod(m.value)}
                          className={clsx(
                            "flex-1 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all border",
                            method === m.value
                              ? `${accentBg} text-white border-transparent shadow-sm`
                              : "bg-slate-50 dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800",
                          )}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Allocation stack */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  FIFO Allocation
                </span>
                {newAdvance > 0 && (
                  <span className="text-[10px] font-bold text-teal-500">
                    +₹{newAdvance.toLocaleString()} advance
                  </span>
                )}
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 font-medium border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                  {existingAdvance > 0
                    ? `No pending ${isReceipt ? "invoices" : "payables"} — advance carried forward.`
                    : `No pending ${isReceipt ? "invoices" : "payables"}.`}
                </div>
              ) : (
                cashAllocations.map((a) => (
                  <div
                    key={a.orderId}
                    className={clsx(
                      "flex items-center justify-between p-4 rounded-xl border transition-all",
                      a.allocated > 0
                        ? allocatedBg
                        : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2
                        size={16}
                        className={clsx(
                          "shrink-0 transition-colors",
                          a.allocated > 0
                            ? allocatedColor
                            : "text-slate-200 dark:text-slate-700",
                        )}
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          #{a.orderId.slice(0, 8).toUpperCase()}
                        </p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <p className="text-[10px] font-semibold text-slate-400">
                            ₹{a.owed.toLocaleString()} outstanding
                          </p>
                          {a.fromAdvance > 0 && (
                            <span className="text-[9px] font-black text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 px-1.5 py-0.5 rounded">
                              ₹{a.fromAdvance.toLocaleString()} advance
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "text-base font-black tracking-tight",
                        a.allocated > 0
                          ? allocatedColor
                          : "text-slate-300 dark:text-slate-700",
                      )}
                    >
                      {a.allocated > 0
                        ? `${isReceipt ? "+" : "−"}₹${a.allocated.toLocaleString()}`
                        : "—"}
                    </span>
                  </div>
                ))
              )}
            </div>
          </form>
        </div>

        {/* Footer CTA */}
        <div className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button
            type="submit"
            form="allocation-form"
            disabled={
              (rawAmount <= 0 && existingAdvance === 0) ||
              (existingAdvance > 0 && rawAmount <= 0 && activeAllocations.length === 0)
            }
            className={clsx(
              "w-full h-14 rounded-xl text-base font-black tracking-wide text-white shadow-lg transition-all disabled:opacity-40",
              isReceipt
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                : "bg-amber-600 hover:bg-amber-700 shadow-amber-500/20",
            )}
          >
            {rawAmount > 0
              ? isReceipt
                ? `Confirm Receipt · ₹${rawAmount.toLocaleString()}`
                : `Confirm Payment · ₹${rawAmount.toLocaleString()}`
              : existingAdvance > 0 && activeAllocations.length > 0
                ? `Apply ₹${Math.min(existingAdvance, maxOwed).toLocaleString()} Advance`
                : isReceipt
                  ? "Confirm Receipt"
                  : "Confirm Payment"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
