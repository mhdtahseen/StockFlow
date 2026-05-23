import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/bottom-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { editSaleOrder, softDeleteSaleOrder } from "@/features/billing/slice";
import { SaleOrder, OrderItem } from "@/features/billing/types";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { Customer } from "@/features/customers/types";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { toast } from "sonner";
import { AlertTriangle, Archive, Percent, Loader2 } from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: SaleOrder;
}

interface ItemDraft {
  id: string;
  phoneId: string | null;
  brandSnapshot: string;
  modelSnapshot: string;
  storageSnapshot: string;
  colorSnapshot: string;
  imeiSnapshot: string[];
  salePriceStr: string;
  discountStr: string;
}

function toDraft(item: OrderItem): ItemDraft {
  return {
    id: item.id,
    phoneId: item.phoneId,
    brandSnapshot: item.brandSnapshot,
    modelSnapshot: item.modelSnapshot,
    storageSnapshot: item.storageSnapshot,
    colorSnapshot: item.colorSnapshot,
    imeiSnapshot: item.imeiSnapshot,
    salePriceStr: String(item.salePrice),
    discountStr: item.discountAmount > 0 ? String(item.discountAmount) : "",
  };
}

export function EditSaleOrderSheet({ open, onOpenChange, order }: Props) {
  const dispatch = useAppDispatch();
  const allCustomers = useAppSelector((s) => s.customers.customers);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [dueDateStr, setDueDateStr] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const found = allCustomers.find((c) => c.id === order.counterpartyId);
    setCustomer(found ?? null);
    setDueDateStr(order.dueDate ?? "");
    setNotes(order.notes ?? "");
    setItems(order.items.map(toDraft));
    setShowDeleteConfirm(false);
  }, [open, order, allCustomers]);

  const isLocked = order.status === "RETURNED";
  const canDelete = order.status === "SETTLED";

  const newTotal = items.reduce((sum, i) => {
    const price = parseFloat(i.salePriceStr) || 0;
    const disc = parseFloat(i.discountStr) || 0;
    return sum + Math.max(0, price - disc);
  }, 0);

  function newStatus(): SaleOrder["status"] {
    if (order.amountPaid <= 0) return "OPEN";
    if (order.amountPaid >= newTotal) return "SETTLED";
    return "PARTIAL";
  }

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  }

  function priceChanged(item: ItemDraft) {
    const orig = order.items.find((i) => i.id === item.id);
    if (!orig) return false;
    return (
      parseFloat(item.salePriceStr) !== orig.salePrice ||
      (parseFloat(item.discountStr) || 0) !== orig.discountAmount
    );
  }

  async function handleSave() {
    if (!customer) return toast.error("Select a customer.");
    if (items.length === 0) return toast.error("No items.");
    for (const item of items) {
      if (!parseFloat(item.salePriceStr))
        return toast.error("All items need a valid price.");
    }
    if (isLocked) return;

    setIsSubmitting(true);
    try {
      const mappedItems: OrderItem[] = items.map((d) => ({
        id: d.id,
        saleOrderId: order.id,
        phoneId: d.phoneId,
        salePrice: parseFloat(d.salePriceStr),
        discountAmount: parseFloat(d.discountStr) || 0,
        effectivePrice:
          parseFloat(d.salePriceStr) - (parseFloat(d.discountStr) || 0),
        imeiSnapshot: d.imeiSnapshot,
        brandSnapshot: d.brandSnapshot,
        modelSnapshot: d.modelSnapshot,
        storageSnapshot: d.storageSnapshot,
        colorSnapshot: d.colorSnapshot,
      }));

      dispatch(
        editSaleOrder({
          id: order.id,
          counterpartyId: customer.id,
          dueDate: dueDateStr || undefined,
          notes: notes || undefined,
          items: mappedItems,
          newTotalAmount: newTotal,
          newStatus: newStatus(),
        }),
      );

      toast.success("Sale order updated.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!canDelete) return;
    setIsSubmitting(true);
    try {
      dispatch(softDeleteSaleOrder(order.id));
      toast.success("Sale order archived. Phones restocked.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to archive.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] flex flex-col p-0 rounded-t-2xl overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle className="text-left text-lg font-black">
            Edit Sale Order
          </SheetTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {isLocked && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-sm text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Returned orders cannot be edited.
            </div>
          )}

          {/* Customer */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Customer
            </label>
            <CustomerPicker
              selectedId={customer?.id}
              onSelect={setCustomer}
              placeholder="Select customer…"
            />
          </div>

          {/* Items */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Items
            </label>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
              >
                {/* Device info (read-only snapshots) */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {item.brandSnapshot} {item.modelSnapshot}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.storageSnapshot} · {item.colorSnapshot}
                    </p>
                    {item.imeiSnapshot?.length > 0 && (
                      <p className="text-xs text-slate-400 font-mono mt-0.5">
                        {item.imeiSnapshot[0]}
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                    Sold
                  </span>
                </div>

                {/* Price changed indicator */}
                {priceChanged(item) && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-2 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    Total and payment status will be recalculated.
                  </div>
                )}

                {/* Sale Price + Discount */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Sale Price
                    </label>
                    <CurrencyInput
                      value={item.salePriceStr}
                      onChange={(v) => updateItem(idx, { salePriceStr: v })}
                      placeholder="₹0"
                      disabled={isLocked}
                      className="w-full"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Percent className="w-3 h-3" /> Discount (₹)
                    </label>
                    <CurrencyInput
                      value={item.discountStr}
                      onChange={(v) => updateItem(idx, { discountStr: v })}
                      placeholder="₹0"
                      disabled={isLocked}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Effective price preview */}
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Effective</span>
                  <span className="font-semibold">
                    ₹
                    {Math.max(
                      0,
                      (parseFloat(item.salePriceStr) || 0) -
                        (parseFloat(item.discountStr) || 0),
                    ).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Due Date + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Due Date
              </label>
              <Input
                type="date"
                value={dueDateStr}
                onChange={(e) => setDueDateStr(e.target.value)}
                disabled={isLocked}
                className="uppercase [color-scheme:light] dark:[color-scheme:dark]"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Notes
              </label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional…"
                disabled={isLocked}
              />
            </div>
          </div>

          {/* Total preview */}
          {!isLocked && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">New Total</span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                ₹{newTotal.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Archive */}
          {canDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 rounded-2xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Archive className="w-4 h-4" /> Archive Order
            </button>
          )}

          {showDeleteConfirm && (
            <div className="rounded-2xl border border-red-200 dark:border-red-800 p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>
                  Archiving this sale will restock all{" "}
                  <strong>{items.length} phone(s)</strong> back to IN_STOCK.
                  Financial history is preserved.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Archive"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {!isLocked && (
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-primary-500 hover:bg-primary-600 text-white font-semibold"
              onClick={handleSave}
              disabled={isSubmitting || !customer}
            >
              {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
