import React, { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addPhone, linkPhoneToPO } from "../features/inventory/slice";
import { addEntry } from "../features/ledger/slice";
import { addPurchaseOrder, addSupplierPayment } from "../features/purchasing/slice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useDeviceCatalog,
  sortBySize,
  type ColorOption,
} from "../hooks/useDeviceCatalog";
import { CatalogAutocomplete } from "../components/ui/CatalogAutocomplete";
import ReusableAutocomplete from "../components/ui/ReusableAutocomplete";
import { issuesFlatList, severityColorMap } from "../data/issueCatalog";
import { type ImeiEntry } from "../utils/validateImei";
import CurrencyInput from "../components/ui/CurrencyInput";
import { CustomerPicker } from "../components/ui/CustomerPicker";
import { Customer } from "../features/customers/types";
import ImeiSection from "../components/ImeiSection";
import clsx from "clsx";
import {
  Smartphone,
  Plus,
  Trash2,
  ChevronLeft,
  Check,
  Wrench,
  ScanBarcode,
  DollarSign,
  Package,
  Building,
  X,
} from "lucide-react";
import {
  AcquisitionChannel,
  PurchaseOrder,
  PurchaseOrderItem,
} from "../features/purchasing/types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface DeviceRow {
  id: string;
  imeis: ImeiEntry[];
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  purchasePrice: string;
  selectedTags: string[];
  tagQuery: string;
}

function makeRow(): DeviceRow {
  return {
    id: crypto.randomUUID(),
    imeis: [{ value: "", status: "UNVERIFIED" }],
    brand: "",
    model: "",
    ram: "",
    storage: "",
    color: "",
    purchasePrice: "",
    selectedTags: [],
    tagQuery: "",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddPhoneUpdate() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const phones = useAppSelector((s) => s.inventory.phones);

  const {
    getBrandOptions,
    getModelOptions,
    getRamOptions,
    getStorageOptions,
    getColorOptions,
  } = useDeviceCatalog();

  // ── Source origin ──────────────────────────────────────────────────────────
  const [channel, setChannel] = useState<AcquisitionChannel>("DIRECT");
  const [vendor, setVendor] = useState<Customer | null>(null);
  const [platformFeeStr, setPlatformFeeStr] = useState("");

  // ── Device rows ───────────────────────────────────────────────────────────
  const [rows, setRows] = useState<DeviceRow[]>([makeRow()]);

  // ── Payment ───────────────────────────────────────────────────────────────
  const [payTab, setPayTab] = useState<"CASH" | "UPI" | "BANK_TRANSFER">(
    "CASH",
  );
  const [cashStr, setCashStr] = useState("");
  const [upiStr, setUpiStr] = useState("");
  const [bankStr, setBankStr] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");

  // ── Top issues from history ────────────────────────────────────────────────
  const topIssues = useMemo(() => {
    const counts: Record<string, number> = {};
    phones.forEach((p) =>
      p.issueTags.forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      }),
    );
    const sorted = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([t]) => t);
    const fallback = [
      "Cracked Screen",
      "Battery Issue",
      "Scuff Marks",
      "Dead Pixels",
      "Charging Port Issue",
    ];
    return [...new Set([...sorted, ...fallback])].slice(0, 5);
  }, [phones]);

  // ── Derived ────────────────────────────────────────────────────────────────
  const platformFee = parseFloat(platformFeeStr) || 0;
  const totalItemCost = rows.reduce(
    (s, r) => s + (parseFloat(r.purchasePrice) || 0),
    0,
  );
  const grandTotal = totalItemCost + platformFee;
  const cashPaid = parseFloat(cashStr) || 0;
  const upiPaid = parseFloat(upiStr) || 0;
  const bankPaid = parseFloat(bankStr) || 0;
  const totalPaid = cashPaid + upiPaid + bankPaid;
  const outstanding = Math.max(0, grandTotal - totalPaid);

  // ── Row helpers ────────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<DeviceRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = () => {
    if (!vendor) return toast.error("Please select a supplier");
    for (const r of rows) {
      if (!r.brand || !r.model || !r.purchasePrice) {
        return toast.error(
          "Please fill in brand, model, and cost for all devices",
        );
      }
    }
    if (outstanding > 0 && !dueDateStr) {
      return toast.error("A due date is required for outstanding balance");
    }

    const poId = crypto.randomUUID();
    const ts = new Date().toISOString();

    const poItems: PurchaseOrderItem[] = rows.map((r) => ({
      id: crypto.randomUUID(),
      purchaseOrderId: poId,
      phoneId: r.id,
      purchasePrice: parseFloat(r.purchasePrice) || 0,
      status: "ACCEPTED",
    }));

    const po: PurchaseOrder = {
      id: poId,
      counterpartyId: vendor.id,
      acquisitionChannel: channel,
      platformFee,
      phonesOrdered: rows.length,
      phonesReceived: rows.length,
      totalAmount: grandTotal,
      amountPaid: totalPaid,
      status: outstanding <= 0 ? "SETTLED" : "PARTIAL",
      dueDate: dueDateStr || undefined,
      createdAt: ts,
      items: poItems,
    };

    // ─── Dispatch order matters for Supabase FK constraints ───────────────
    // 1. Add phones FIRST — purchase_order_items has a FK on phones.id,
    //    so phones must exist in the DB before the PO is synced.
    rows.forEach((r) => {
      dispatch(
        addPhone({
          id: r.id,
          brand: r.brand,
          model: r.model,
          ram: r.ram || "N/A",
          storage: r.storage,
          color: r.color,
          purchasePrice: parseFloat(r.purchasePrice) || 0,
          imeis: r.imeis.filter((e) => e.value.length > 0).map((e) => e.value),
          issueTags: r.selectedTags,
          status: "IN_STOCK",
          createdAt: ts,
        }),
      );
    });

    // 2. Add PO AFTER phones — create_purchase_order RPC inserts items that
    //    reference the phone IDs we just inserted above.
    dispatch(addPurchaseOrder(po));

    // 3. Link phones to PO — both phone and PO now exist in the DB.
    rows.forEach((r) => {
      dispatch(linkPhoneToPO({ phoneId: r.id, purchaseOrderId: poId }));
    });

    // 4. Optimistically add payment and ledger entry if any amount is paid.
    if (totalPaid > 0) {
      dispatch(
        addSupplierPayment({
          id: crypto.randomUUID(),
          counterpartyId: vendor.id,
          totalPaid: totalPaid,
          mode: "CASH", // Future: support other modes natively here
          paidAt: ts,
          recordedBy: vendor.id, // we don't have user.id here directly unless we import it, let's use a placeholder or tenant
          allocations: [{ purchaseOrderId: poId, amountAllocated: totalPaid }],
        }),
      );
      dispatch(
        addEntry({
          id: crypto.randomUUID(),
          createdAt: ts,
          description: `Payment to ${vendor.name}`,
          type: "FUNDS_CONSUMED",
          amount: -totalPaid,
          balanceAfter: 0,
          counterpartyId: vendor.id,
          purchaseOrderId: poId,
          paymentMode: "CASH",
          status: "PENDING", // PENDING so that ledger sync can replace it without duplicate
        } as any),
      );
    }

    // Resulting wallet impact will be handled by the create_purchase_order RPC (Cash Basis).

    toast.success(
      `${rows.length} device${rows.length > 1 ? "s" : ""} ingested successfully`,
    );
    navigate("/inventory");
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 dark:bg-slate-950 font-sans">
      {/* ─── Header ─────────────────────────────────────────────────────────── */}
      {/* <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-4 py-4 flex items-center gap-3 sticky top-0 z-40 shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="size-9 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
            Bulk Device Ingest
          </h1>
          <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
            Add one or more devices from a single source
          </p>
        </div>
      </div> */}

      <div className="flex-1 max-w-2xl w-full mx-auto px-4 py-5 space-y-4 pb-28">
        {/* ─── Source Origin ──────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
          {/* Tab toggles */}
          <div className="flex border-b border-slate-100 dark:border-slate-800">
            {(["DIRECT", "PLATFORM"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannel(c)}
                className={clsx(
                  "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all",
                  channel === c
                    ? "bg-primary-500 text-white"
                    : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                )}
              >
                {c === "DIRECT" ? "Direct" : "Platform"}
              </button>
            ))}
          </div>

          <div className="p-4 space-y-3">
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                {channel === "DIRECT"
                  ? "Supplier / Vendor"
                  : "Platform / Marketplace"}
              </label>
              <CustomerPicker selectedId={vendor?.id} onSelect={setVendor} />
            </div>

            {channel === "PLATFORM" && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                  Platform Fee / Logistics
                </label>
                <CurrencyInput
                  value={platformFeeStr}
                  onChange={setPlatformFeeStr}
                  placeholder="0.00"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Device Rows ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {rows.map((row, index) => (
            <DeviceCard
              key={row.id}
              row={row}
              index={index}
              canRemove={rows.length > 1}
              topIssues={topIssues}
              getBrandOptions={getBrandOptions}
              getModelOptions={getModelOptions}
              getRamOptions={getRamOptions}
              getStorageOptions={getStorageOptions}
              getColorOptions={getColorOptions}
              onUpdate={(patch) => updateRow(row.id, patch)}
              onRemove={() => removeRow(row.id)}
            />
          ))}
        </div>

        {/* ─── Add Another Device ─────────────────────────────────────────── */}
        <button
          onClick={() => setRows((prev) => [...prev, makeRow()])}
          className="w-full py-4 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-400 dark:text-slate-500 hover:border-primary-500/40 hover:text-primary-500 transition-all flex items-center justify-center gap-2"
        >
          <Plus size={18} strokeWidth={2.5} />
          Add Another Device
        </button>

        {/* ─── Fiscal Settlement ──────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
          <div className="px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign
                size={16}
                className="text-primary-500"
                strokeWidth={2.5}
              />
              <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                Fiscal Settlement
              </span>
            </div>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100">
              ₹{grandTotal.toLocaleString("en-IN")}
            </span>
          </div>

          <div className="p-4 space-y-4">
            {/* Payment method tabs */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Payment Method
              </label>
              <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                {(["CASH", "UPI", "BANK_TRANSFER"] as const).map((m) => {
                  const val =
                    m === "CASH" ? cashPaid : m === "UPI" ? upiPaid : bankPaid;
                  return (
                    <button
                      key={m}
                      onClick={() => setPayTab(m)}
                      className={clsx(
                        "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all relative",
                        payTab === m
                          ? "bg-white dark:bg-slate-800 text-primary-500 shadow-sm"
                          : "text-slate-400 hover:text-slate-600",
                      )}
                    >
                      {m.replace("_", " ")}
                      {val > 0 && (
                        <span className="absolute -top-1 -right-1 size-2 bg-primary-500 rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active payment input */}
            <div className="animate-in fade-in duration-150">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                {payTab.replace("_", " ")} Amount
              </label>
              {payTab === "CASH" && (
                <CurrencyInput value={cashStr} onChange={setCashStr} />
              )}
              {payTab === "UPI" && (
                <CurrencyInput value={upiStr} onChange={setUpiStr} />
              )}
              {payTab === "BANK_TRANSFER" && (
                <CurrencyInput value={bankStr} onChange={setBankStr} />
              )}
            </div>

            {/* Summary row */}
            <div className="pt-2 border-t border-slate-50 dark:border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span>Amount Paid</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold">
                  ₹{totalPaid.toLocaleString("en-IN")}
                </span>
              </div>
              {outstanding > 0 && (
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-amber-600 dark:text-amber-400">
                    Outstanding
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    ₹{outstanding.toLocaleString("en-IN")}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                <span className="text-slate-900 dark:text-slate-100">
                  Grand Total
                </span>
                <span className="text-slate-900 dark:text-slate-100">
                  ₹{grandTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Due date — shows when there's an outstanding */}
            {outstanding > 0 && (
              <div className="animate-in slide-in-from-top-2 duration-200 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
                <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Credit Settlement — Due Date Required
                </p>
                <input
                  type="date"
                  value={dueDateStr}
                  onChange={(e) => setDueDateStr(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            )}
          </div>
        </div>

        {/* ─── Submit ─────────────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          className="w-full bg-primary-500 hover:bg-blue-800 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
        >
          <Package size={20} strokeWidth={2.5} />
          Commit Bulk Ingest
        </button>
      </div>
    </div>
  );
}

// ─── DeviceCard ───────────────────────────────────────────────────────────────

interface DeviceCardProps {
  row: DeviceRow;
  index: number;
  canRemove: boolean;
  topIssues: string[];
  getBrandOptions: () => string[];
  getModelOptions: (brand: string) => string[];
  getRamOptions: (brand: string, model: string) => string[];
  getStorageOptions: (brand: string, model: string) => string[];
  getColorOptions: (brand: string, model: string) => ColorOption[];
  onUpdate: (patch: Partial<DeviceRow>) => void;
  onRemove: () => void;
}

function DeviceCard({
  row,
  index,
  canRemove,
  topIssues,
  getBrandOptions,
  getModelOptions,
  getRamOptions,
  getStorageOptions,
  getColorOptions,
  onUpdate,
  onRemove,
}: DeviceCardProps) {
  const [showIssues, setShowIssues] = useState(false);

  const toggleTag = (tag: string) => {
    const next = row.selectedTags.includes(tag)
      ? row.selectedTags.filter((t) => t !== tag)
      : [...row.selectedTags, tag];
    onUpdate({ selectedTags: next });
  };

  const brandOptions = getBrandOptions();
  const modelOptions = getModelOptions(row.brand);
  const ramOptions = sortBySize(getRamOptions(row.brand, row.model));
  const storageOptions = sortBySize(getStorageOptions(row.brand, row.model));
  const colorOptions = getColorOptions(row.brand, row.model);

  const selectedTagCount = row.selectedTags.length;
  const overflowCount = selectedTagCount > 2 ? selectedTagCount - 2 : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="size-7 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg flex items-center justify-center text-[11px] font-black">
            {index + 1}
          </div>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Device #{index + 1}
          </span>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="size-7 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 transition-all"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* IMEI */}
        <ImeiSection
          imeis={row.imeis}
          onChange={(imeis) => onUpdate({ imeis })}
          showVerificationSection={false}
        />

        {/* Brand */}
        <div className="grid">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Brand
          </label>
          <CatalogAutocomplete
            options={brandOptions}
            value={row.brand}
            onChange={(v) =>
              onUpdate({
                brand: v,
                model: "",
                ram: "",
                storage: "",
                color: "",
              })
            }
            placeholder="Select Brand"
          />
        </div>

        {/* Brand + Model */}
        <div className="grid">
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Model
          </label>
          <CatalogAutocomplete
            options={modelOptions}
            value={row.model}
            onChange={(v) =>
              onUpdate({ model: v, ram: "", storage: "", color: "" })
            }
            disabled={!row.brand}
            //   placeholder={row.brand ? `${row.brand} model…` : "Select brand"}
          />
        </div>

        {/* RAM + Storage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              RAM
            </label>
            <CatalogAutocomplete
              options={ramOptions}
              value={row.ram}
              onChange={(v) => onUpdate({ ram: v })}
              disabled={!row.model}
              placeholder="8GB…"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
              Storage
            </label>
            <CatalogAutocomplete
              options={storageOptions}
              value={row.storage}
              onChange={(v) => onUpdate({ storage: v })}
              disabled={!row.model}
              placeholder="256GB…"
            />
          </div>
        </div>

        {/* Color */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Color
          </label>
          <CatalogAutocomplete
            options={colorOptions}
            value={row.color}
            onChange={(v) => onUpdate({ color: v })}
            disabled={!row.model}
            placeholder="Titanium, Midnight…"
          />
          {row.color &&
            (() => {
              const match = colorOptions.find((c) => c.label === row.color);
              if (!match) return null;
              return (
                <div className="flex items-center gap-2 mt-1.5 pl-1">
                  <span
                    className="size-3.5 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: match.hex }}
                  />
                  <span className="text-[11px] font-semibold text-slate-400">
                    {match.hex}
                  </span>
                </div>
              );
            })()}
        </div>

        {/* Cost */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
            Purchase Cost
          </label>
          <CurrencyInput
            value={row.purchasePrice}
            onChange={(v) => onUpdate({ purchasePrice: v })}
            placeholder="0.00"
          />
        </div>

        {/* Condition / Issues */}
        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench
                size={14}
                className="text-primary-500"
                strokeWidth={2.5}
              />
              <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                Condition / Issues
              </span>
            </div>
            <div className="flex items-center gap-2">
              {selectedTagCount > 0 && (
                <span className="text-[10px] font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-md">
                  {selectedTagCount} tagged
                </span>
              )}
              <button
                onClick={() => setShowIssues(!showIssues)}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-wide"
              >
                {showIssues ? "Collapse" : "Expand"}
              </button>
            </div>
          </div>

          {/* Selected tags summary (always visible) */}
          {selectedTagCount > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {row.selectedTags.slice(0, 2).map((tag) => {
                const item = issuesFlatList.find(
                  (i) => i.label === tag || i.aliases?.includes(tag),
                );
                const colors = severityColorMap[item?.severity || 1];
                return (
                  <span
                    key={tag}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.text + "30",
                    }}
                  >
                    {tag}
                    <button
                      onClick={() => toggleTag(tag)}
                      className="opacity-60 hover:opacity-100"
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
              {overflowCount > 0 && (
                <button
                  onClick={() => setShowIssues(true)}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                >
                  +{overflowCount} more
                </button>
              )}
            </div>
          )}

          {showIssues && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-200">
              {/* Quick-tap popular issues */}
              <div className="flex flex-wrap gap-1.5">
                {topIssues.map((tag) => {
                  const isSelected = row.selectedTags.includes(tag);
                  const item = issuesFlatList.find(
                    (i) => i.label === tag || i.aliases?.includes(tag),
                  );
                  const colors = severityColorMap[item?.severity || 1];
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      style={
                        isSelected
                          ? {
                              backgroundColor: colors.bg,
                              color: colors.text,
                              borderColor: colors.text + "40",
                            }
                          : {}
                      }
                      className={clsx(
                        "flex items-center gap-1 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all active:scale-95",
                        isSelected
                          ? "font-bold"
                          : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      {tag}
                      {isSelected ? (
                        <Check size={12} strokeWidth={3} />
                      ) : (
                        <Plus size={12} className="opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Search from full catalog */}
              <ReusableAutocomplete
                data={issuesFlatList}
                value={row.tagQuery}
                onChange={(q) => onUpdate({ tagQuery: q })}
                onSelect={(val) => {
                  const t = val.trim();
                  if (t && !row.selectedTags.includes(t)) {
                    onUpdate({
                      selectedTags: [...row.selectedTags, t],
                      tagQuery: "",
                    });
                  } else {
                    onUpdate({ tagQuery: "" });
                  }
                }}
                placeholder="Search condition catalog…"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
