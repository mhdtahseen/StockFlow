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
} from "lucide-react";
import clsx from "clsx";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}

interface ItemDraft {
  id?: string;        // present for existing items
  phoneId?: string | null;
  brand: string;
  model: string;
  storage: string;
  color: string;
  ram: string;
  imei: string;
  issueTags: string[];
  purchasePriceStr: string;
  hasPhone: boolean;  // true if phone record already exists (received)
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

  const newTotal =
    items.reduce((sum, i) => sum + (parseFloat(i.purchasePriceStr) || 0), 0) +
    (parseFloat(platformFeeStr) || 0);

  function newStatus(): PurchaseOrder["status"] {
    if (order.status === "AWAITING_RECEIPT") {
      if (order.amountPaid <= 0) return "AWAITING_RECEIPT";
      if (order.amountPaid >= newTotal) return "SETTLED";
      return "PARTIAL";
    }
    if (order.amountPaid <= 0) return "RECEIVED";
    if (order.amountPaid >= newTotal) return "SETTLED";
    return "PARTIAL";
  }

  // ── Item helpers ──────────────────────────────────────────────────────────
  function addItem() {
    setItems((prev) => [
      ...prev,
      {
        brand: "Apple",
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
    if (items[idx].hasPhone) {
      toast.error(
        `Cannot remove ${items[idx].brand} ${items[idx].model} — phone already exists in inventory.`,
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
      const mappedItems: PurchaseOrderItem[] = items.map((d) => ({
        id: d.id!,
        purchaseOrderId: order.id,
        phoneId: d.phoneId ?? null,
        purchasePrice: parseFloat(d.purchasePriceStr),
        status: "PENDING_INSPECTION" as const,
        brand: d.brand,
        model: d.model,
        storage: d.storage,
        color: d.color,
        ram: d.ram,
        imei: d.imei,
        issueTags: d.issueTags,
      }));

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
        className="h-[92dvh] flex flex-col p-0 rounded-t-2xl overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle className="text-left text-lg font-black">
            Edit Purchase Order
          </SheetTitle>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* Edit locked notice */}
          {isLocked && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-sm text-slate-500 dark:text-slate-400">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              Cancelled orders cannot be edited.
            </div>
          )}

          {/* Supplier */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Supplier
            </label>
            <CustomerPicker
              selectedId={vendor?.id}
              onSelect={setVendor}
              placeholder="Select supplier…"
            />
          </div>

          {/* Channel */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Channel
            </label>
            <div className="flex gap-2">
              {CHANNELS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setChannel(c.value)}
                  className={clsx(
                    "flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors",
                    channel === c.value
                      ? "bg-primary-500 text-white border-primary-500"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Items ({items.length})
              </label>
              <Button
                variant="ghost"
                size="sm"
                onClick={addItem}
                disabled={isLocked}
                className="text-primary-500 font-semibold text-sm"
              >
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            </div>

            {items.map((item, idx) => (
              <div
                key={item.id ?? `new-${idx}`}
                className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3"
              >
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Item {idx + 1}
                    {item.hasPhone && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        · In Inventory
                      </span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(idx)}
                    disabled={item.hasPhone || isLocked}
                    className={clsx(
                      "p-1 rounded-lg transition-colors",
                      item.hasPhone || isLocked
                        ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                        : "text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20",
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* COGS impact warning */}
                {cogsChanged(item) && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 p-2 text-xs text-amber-700 dark:text-amber-400">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>
                      Price change will update this phone's purchase cost (COGS)
                      from ₹
                      {
                        order.items.find((i) => i.id === item.id)
                          ?.purchasePrice
                      }{" "}
                      → ₹{item.purchasePriceStr}
                    </span>
                  </div>
                )}

                {/* Brand + Model */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Brand
                    </label>
                    <CatalogAutocomplete
                      value={item.brand}
                      onChange={(v) => updateItem(idx, { brand: v, model: "" })}
                      options={getBrandOptions()}
                      placeholder="Brand"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Model
                    </label>
                    <CatalogAutocomplete
                      value={item.model}
                      onChange={(v) => updateItem(idx, { model: v })}
                      options={getModelOptions(item.brand)}
                      placeholder="Model"
                      disabled={isLocked}
                    />
                  </div>
                </div>

                {/* Storage + Color */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Storage
                    </label>
                    <CatalogAutocomplete
                      value={item.storage}
                      onChange={(v) => updateItem(idx, { storage: v })}
                      options={sortBySize(getStorageOptions(item.brand, item.model))}
                      placeholder="Storage"
                      disabled={isLocked}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400">
                      Color
                    </label>
                    <CatalogAutocomplete
                      value={item.color}
                      onChange={(v) => updateItem(idx, { color: v })}
                      options={getColorOptions(item.brand, item.model)}
                      placeholder="Color"
                      disabled={isLocked}
                    />
                  </div>
                </div>

                {/* Purchase Price */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    Purchase Price
                  </label>
                  <CurrencyInput
                    value={item.purchasePriceStr}
                    onChange={(v) => updateItem(idx, { purchasePriceStr: v })}
                    placeholder="₹0"
                    disabled={isLocked}
                    className="w-full"
                  />
                </div>

                {/* IMEI (read-only if phone exists) */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 dark:text-slate-400">
                    IMEI
                    {item.hasPhone && (
                      <span className="ml-1 text-slate-400">(locked after receipt)</span>
                    )}
                  </label>
                  <Input
                    value={item.imei}
                    onChange={(e) => updateItem(idx, { imei: e.target.value })}
                    placeholder="IMEI (optional)"
                    disabled={isLocked || item.hasPhone}
                    className="text-sm"
                  />
                </div>
              </div>
            ))}

            {items.length === 0 && (
              <button
                type="button"
                onClick={addItem}
                className="w-full py-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-slate-400 text-sm flex flex-col items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add first item
              </button>
            )}
          </div>

          {/* Platform Fee */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Platform Fee
            </label>
            <CurrencyInput
              value={platformFeeStr}
              onChange={setPlatformFeeStr}
              placeholder="₹0 (optional)"
              disabled={isLocked}
              className="w-full"
            />
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

          {/* New total preview */}
          {!isLocked && (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4 flex items-center justify-between">
              <span className="text-sm text-slate-500 dark:text-slate-400">
                New Total
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                ₹{newTotal.toLocaleString("en-IN")}
              </span>
            </div>
          )}

          {/* Soft delete section */}
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
                  This will archive the order. Phones linked to it will remain
                  in inventory. This action cannot be undone.
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
                  Archive
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
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
              disabled={isSubmitting || items.length === 0 || !vendor}
            >
              {isSubmitting ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
