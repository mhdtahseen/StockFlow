import React, { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  editPurchaseOrder,
  softDeletePurchaseOrder,
} from "@/features/purchasing/slice";
import {
  PurchaseOrder,
  PurchaseOrderItem,
  AcquisitionChannel,
  POItemStatus,
} from "@/features/purchasing/types";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { Customer } from "@/features/customers/types";
import { CatalogAutocomplete } from "@/components/ui/CatalogAutocomplete";
import { useDeviceCatalog, sortBySize } from "@/hooks/useDeviceCatalog";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import {
  Plus,
  Trash2,
  AlertTriangle,
  Archive,
  Pencil,
  Info,
  Loader2,
} from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}

interface ItemDraft {
  id?: string;             // present for existing items
  phoneId?: string | null;
  status: POItemStatus;    // preserves ACCEPTED / REJECTED / PENDING_INSPECTION
  rejectionReason?: string;
  brand: string;
  model: string;
  storage: string;
  color: string;
  ram: string;
  imei: string;
  issueTags: string[];
  purchasePriceStr: string;
  hasPhone: boolean;       // true if phone record already exists in inventory
}

const CHANNELS: { value: AcquisitionChannel; label: string }[] = [
  { value: "DIRECT", label: "Direct" },
  { value: "PLATFORM", label: "Platform" },
  { value: "INTER_TENANT", label: "Inter-Tenant" },
];

function toDraft(item: PurchaseOrderItem): ItemDraft {
  return {
    id: item.id,
    phoneId: item.phoneId,
    status: item.status ?? "PENDING_INSPECTION",
    rejectionReason: item.rejectionReason,
    brand: item.brand || "",
    model: item.model || "",
    storage: item.storage || "",
    color: item.color || "",
    ram: item.ram || "",
    imei: item.imei || "",
    issueTags: item.issueTags || [],
    purchasePriceStr: String(item.purchasePrice ?? ""),
    hasPhone: !!item.phoneId,
  };
}

export function EditPurchaseOrderSheet({ open, onOpenChange, order }: Props) {
  const dispatch = useAppDispatch();
  const { user } = useAuth();
  const allCustomers = useAppSelector((s) => s.customers.customers);
  const {
    getBrandOptions,
    getModelOptions,
    getStorageOptions,
    getColorOptions,
    getRamOptions,
  } = useDeviceCatalog();

  // ── Form State ────────────────────────────────────────────────────────────
  const [vendor, setVendor] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<AcquisitionChannel>("DIRECT");
  const [platformFeeStr, setPlatformFeeStr] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<ItemDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Populate from order when sheet opens ─────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const found = allCustomers.find((c) => c.id === order.counterpartyId);
    setVendor(found ?? null);
    setChannel(order.acquisitionChannel);
    setPlatformFeeStr(order.platformFee > 0 ? String(order.platformFee) : "");
    setDueDateStr(order.dueDate ?? "");
    setNotes(order.notes ?? "");
    setItems(order.items.map(toDraft));
    setShowDeleteConfirm(false);
  }, [open, order, allCustomers]);

  // ── Computed values ───────────────────────────────────────────────────────
  const canDelete = order.status === "SETTLED";
  const isLocked = order.status === "CANCELLED";

  // Only non-rejected items count toward the order total (rejected items = ₹0)
  const newTotal =
    items
      .filter((i) => i.status !== "REJECTED")
      .reduce((sum, i) => sum + (parseFloat(i.purchasePriceStr) || 0), 0) +
    (parseFloat(platformFeeStr) || 0);

  // Are all items resolved (none still PENDING_INSPECTION)?
  const allItemsResolved = items.length > 0 && items.every(
    (i) => i.status !== "PENDING_INSPECTION",
  );

  function newStatus(): PurchaseOrder["status"] {
    // If currently AWAITING_RECEIPT (not yet received at all)
    if (order.status === "AWAITING_RECEIPT") {
      if (order.amountPaid <= 0) return "AWAITING_RECEIPT";
      if (order.amountPaid >= newTotal) return "SETTLED";
      return "PARTIAL";
    }
    // For RECEIVED / PARTIAL / SETTLED — receipt already happened, preserve that
    if (allItemsResolved) {
      if (order.amountPaid <= 0) return "RECEIVED";
      if (order.amountPaid >= newTotal) return "SETTLED";
      return "PARTIAL";
    }
    // Some items still pending inspection
    if (order.amountPaid <= 0) return "RECEIVED";
    if (order.amountPaid >= newTotal) return "SETTLED";
    return "PARTIAL";
  }

  // ── Item helpers ──────────────────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        status: "PENDING_INSPECTION" as POItemStatus,
        brand: "",
        model: "",
        storage: "",
        color: "",
        ram: "",
        imei: "",
        issueTags: [],
        purchasePriceStr: "",
        hasPhone: false,
      },
    ]);
  }

  function removeItem(idx: number) {
    const item = items[idx];
    if (item.status === "ACCEPTED") {
      toast.error(
        `Cannot remove ${item.brand} ${item.model} — already accepted into inventory.`,
      );
      return;
    }
    if (item.status === "REJECTED") {
      toast.error(
        `Cannot remove ${item.brand} ${item.model} — rejected items stay as audit records.`,
      );
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, patch: Partial<ItemDraft>) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, ...patch } : item)),
    );
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!vendor) return toast.error("Select a supplier.");
    if (items.length === 0) return toast.error("Add at least one item.");
    for (const item of items) {
      if (!item.model) return toast.error("All items need a model.");
      if (!parseFloat(item.purchasePriceStr))
        return toast.error("All items need a valid price.");
    }
    if (isLocked) return;

    setIsSubmitting(true);
    try {
      const mappedItems: PurchaseOrderItem[] = items.map((d) => {
        // Preserve the original item status — never reset ACCEPTED/REJECTED back to PENDING
        const originalItem = d.id ? order.items.find((i) => i.id === d.id) : undefined;
        const preservedStatus: POItemStatus = originalItem?.status ?? "PENDING_INSPECTION";
        return {
          id: d.id!,
          purchaseOrderId: order.id,
          phoneId: d.phoneId ?? null,
          purchasePrice: parseFloat(d.purchasePriceStr),
          status: preservedStatus,
          rejectionReason: originalItem?.rejectionReason,
          brand: d.brand,
          model: d.model,
          storage: d.storage,
          color: d.color,
          ram: d.ram,
          imei: d.imei,
          issueTags: d.issueTags,
        };
      });

      dispatch(
        editPurchaseOrder({
          id: order.id,
          counterpartyId: vendor.id,
          acquisitionChannel: channel,
          platformFee: parseFloat(platformFeeStr) || 0,
          dueDate: dueDateStr || undefined,
          notes: notes || undefined,
          items: mappedItems,
          newTotalAmount: newTotal,
          newStatus: newStatus(),
        }),
      );

      toast.success("Purchase order updated.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!canDelete) return;
    setIsSubmitting(true);
    try {
      dispatch(softDeletePurchaseOrder(order.id));
      toast.success("Purchase order archived.");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to archive.");
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── COGS impact indicator ─────────────────────────────────────────────────
  function cogsChanged(item: ItemDraft) {
    if (!item.id || !item.hasPhone) return false;
    const orig = order.items.find((i) => i.id === item.id);
    return orig && parseFloat(item.purchasePriceStr) !== orig.purchasePrice;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] flex flex-col p-0 rounded-t-[2.5rem] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl font-black">Edit Order</SheetTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                #{order.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-primary-500 dark:text-blue-400">
                NEW TOTAL
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 italic">
                ₹{newTotal.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-32 space-y-6">
          {/* Locked notice */}
          {isLocked && (
            <div className="flex items-center gap-3 rounded-2xl bg-slate-100 dark:bg-slate-800 p-4 text-sm font-semibold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
              <AlertTriangle className="w-4 h-4 shrink-0 text-slate-400" />
              Cancelled orders cannot be edited.
            </div>
          )}

          {/* Section 1: Supplier + Channel */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6">
            <div className="flex-1">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">
                1. Supplier
              </label>
              <CustomerPicker
                selectedId={vendor?.id}
                onSelect={setVendor}
                placeholder="Select supplier…"
              />
            </div>
            <div className="w-full sm:w-64">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">
                2. Channel
              </label>
              <div className="grid grid-cols-3 gap-2">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    disabled={isLocked}
                    className={clsx(
                      "py-2.5 rounded-xl text-[10px] font-black tracking-wide border transition-all",
                      channel === c.value
                        ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-blue-900/20"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800",
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Section 2: Items */}
          <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">Items</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {items.length} device{items.length !== 1 ? "s" : ""}
                </p>
              </div>
              {!isLocked && (
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-[10px] font-black text-primary-500 uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  <Plus size={14} /> Add
                </button>
              )}
            </div>

            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {items.map((item, idx) => {
                const isAccepted = item.status === "ACCEPTED";
                const isRejected = item.status === "REJECTED";
                const isPending  = item.status === "PENDING_INSPECTION";
                // ACCEPTED: only price editable (COGS). REJECTED: fully read-only. PENDING: fully editable.
                const fieldsLocked = isLocked || isAccepted || isRejected;
                const priceEditable = !isLocked && (isAccepted || isPending);

                return (
                  <div
                    key={item.id ?? `new-${idx}`}
                    className={clsx(
                      "p-6 animate-in fade-in slide-in-from-right-2 duration-300",
                      isRejected
                        ? "bg-slate-50 dark:bg-slate-900/50 opacity-60"
                        : "bg-white dark:bg-slate-900",
                    )}
                  >
                    {/* Row header */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={clsx(
                          "size-6 rounded-lg flex items-center justify-center text-[10px] font-black",
                          isAccepted
                            ? "bg-emerald-500 text-white"
                            : isRejected
                            ? "bg-rose-400 text-white"
                            : "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900",
                        )}>
                          {idx + 1}
                        </span>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tight">
                          Device
                        </span>
                        {isAccepted && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            ✓ In Inventory
                          </span>
                        )}
                        {isRejected && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            ✕ Rejected{item.rejectionReason ? ` · ${item.rejectionReason.replace("_", " ")}` : ""}
                          </span>
                        )}
                        {isPending && (
                          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            Awaiting Inspection
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={!isPending || isLocked}
                        className={clsx(
                          "p-2 rounded-lg transition-colors",
                          !isPending || isLocked
                            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            : "text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20",
                        )}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* COGS warning for accepted items with changed price */}
                    {cogsChanged(item) && (
                      <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-400">
                        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                        <span>
                          Price change will update this phone's cost (COGS) from ₹
                          {order.items.find((i) => i.id === item.id)?.purchasePrice} → ₹{item.purchasePriceStr}
                        </span>
                      </div>
                    )}

                    {/* Fields grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-3">
                        <CatalogAutocomplete
                          label="Brand"
                          value={item.brand}
                          onChange={(v) => updateItem(idx, { brand: v, model: "" })}
                          options={getBrandOptions()}
                          disabled={fieldsLocked}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <CatalogAutocomplete
                          label="Model"
                          value={item.model}
                          onChange={(v) => updateItem(idx, { model: v })}
                          options={getModelOptions(item.brand)}
                          placeholder="Model…"
                          disabled={fieldsLocked || !item.brand}
                        />
                      </div>
                      <div className="sm:col-span-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <CatalogAutocomplete
                            label="RAM"
                            value={item.ram}
                            onChange={(v) => updateItem(idx, { ram: v })}
                            options={getRamOptions(item.brand, item.model)}
                            disabled={fieldsLocked || !item.model}
                            placeholder="RAM"
                          />
                          <CatalogAutocomplete
                            label="Storage"
                            value={item.storage}
                            onChange={(v) => updateItem(idx, { storage: v })}
                            options={sortBySize(getStorageOptions(item.brand, item.model))}
                            disabled={fieldsLocked || !item.model}
                            placeholder="Storage"
                          />
                        </div>
                        <CatalogAutocomplete
                          label="Color"
                          value={item.color}
                          onChange={(v) => updateItem(idx, { color: v })}
                          options={getColorOptions(item.brand, item.model)}
                          disabled={fieldsLocked || !item.model}
                          placeholder="Color"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">
                          Cost (₹)
                          {isAccepted && (
                            <span className="ml-1 normal-case font-semibold text-amber-500"> · COGS</span>
                          )}
                        </label>
                        <CurrencyInput
                          value={item.purchasePriceStr}
                          onChange={(v) => updateItem(idx, { purchasePriceStr: v })}
                          className="h-12 text-sm! font-black py-0! rounded-xl pl-10!"
                          placeholder="0.00"
                          disabled={!priceEditable}
                        />
                      </div>
                    </div>

                    {/* IMEI — shown for PENDING and ACCEPTED, hidden for REJECTED */}
                    {!isRejected && (
                      <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">
                          IMEI
                          {isAccepted && (
                            <span className="ml-2 normal-case font-semibold text-slate-400">(locked — already in inventory)</span>
                          )}
                        </label>
                        <Input
                          value={item.imei}
                          onChange={(e) => updateItem(idx, { imei: e.target.value })}
                          placeholder="IMEI (optional)"
                          disabled={fieldsLocked}
                          className="text-sm font-semibold"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {items.length === 0 && (
              <div className="p-12 flex flex-col items-center gap-3 text-slate-400">
                <Plus className="w-6 h-6" />
                <p className="text-sm font-semibold">No items — tap Add above</p>
              </div>
            )}

            {!isLocked && (
              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addItem}
                  className="group text-primary-500 dark:text-blue-400 font-black text-xs uppercase tracking-widest gap-2 py-6 w-full rounded-2xl hover:bg-white dark:hover:bg-slate-900 transition-all"
                >
                  <Plus size={18} className="group-hover:scale-125 transition-transform" />
                  Add Item
                </Button>
              </div>
            )}
          </section>

          {/* Section 3: Details */}
          <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">
              3. Details
            </label>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Platform / Logistics Fee
                  </span>
                  <span className="text-xs text-slate-400">Included in total</span>
                </div>
                <CurrencyInput
                  value={platformFeeStr}
                  onChange={setPlatformFeeStr}
                  className="h-12 text-base! py-0! rounded-xl font-bold"
                  disabled={isLocked}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Due Date</label>
                  <Input
                    type="date"
                    value={dueDateStr}
                    onChange={(e) => setDueDateStr(e.target.value)}
                    disabled={isLocked}
                    className="h-11 font-semibold rounded-xl"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-2">Notes</label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional…"
                    disabled={isLocked}
                    className="h-11 font-semibold rounded-xl"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Archive */}
          {canDelete && !showDeleteConfirm && (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-4 rounded-3xl border border-red-200 dark:border-red-800 text-red-500 dark:text-red-400 text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors bg-white dark:bg-slate-900"
            >
              <Archive className="w-4 h-4" /> Archive Order
            </button>
          )}

          {showDeleteConfirm && (
            <div className="rounded-3xl border border-red-200 dark:border-red-800 p-6 space-y-4 bg-white dark:bg-slate-900">
              <div className="flex items-start gap-3 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
                <p className="font-semibold leading-relaxed">
                  This will archive the order. Phones linked to it will remain
                  in inventory. This cannot be undone.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 rounded-2xl"
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black"
                  onClick={handleDelete}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Archive"}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLocked && (
          <div className="px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500">
                <Pencil size={20} />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-tight">
                  Updated Total
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-slate-100 italic">
                  ₹{newTotal.toLocaleString("en-IN")}{" "}
                  <span className="text-sm font-medium text-slate-400 not-italic">
                    ({items.length} item{items.length !== 1 ? "s" : ""})
                  </span>
                </span>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                variant="outline"
                className="flex-1 sm:flex-none h-14 px-6 rounded-2xl font-black"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 sm:flex-none px-10 h-14 rounded-2xl text-base font-black tracking-wide bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]"
                onClick={handleSave}
                disabled={isSubmitting || items.length === 0 || !vendor}
              >
                {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</> : "Save Changes"}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
