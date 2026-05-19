import React, { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addPhone, linkPhoneToPO } from "../features/inventory/slice";
import { addPurchaseOrder, addSupplierPayment } from "../features/purchasing/slice";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  useDeviceCatalog,
  sortBySize,
  type ColorOption,
} from "../hooks/useDeviceCatalog";
import { CatalogAutocomplete } from "../components/ui/CatalogAutocomplete";
import {
  Plus, Trash2, Camera, Info, Wrench, X, MonitorSmartphone, 
  Search, HardDrive, Palette, History, Fingerprint, 
  ChevronDown, Check, Smartphone, ChevronLeft, ScanBarcode, DollarSign, Package, Building, ArrowRight, Receipt, Loader2
} from "lucide-react";
import IssueSelector from "../components/IssueSelector";
import { issuesFlatList, severityColorMap } from "../data/issueCatalog";
import { type ImeiEntry } from "../utils/validateImei";
import CurrencyInput from "../components/ui/CurrencyInput";
import { CustomerPicker } from "../components/ui/CustomerPicker";
import { Customer } from "../features/customers/types";
import ImeiSection from "../components/ImeiSection";
import Autocomplete from "../components/ui/Autocomplete";
import { PLATFORM_CATALOG } from "../data/platforms";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  AcquisitionChannel,
  PurchaseOrder,
  PurchaseOrderItem,
} from "../features/purchasing/types";
import { usePlan } from "../hooks/usePlan";
import { useUpgradeGate } from "../context/UpgradeGateContext";
import { useAuth } from "../context/AuthContext";
import {
  determineGstType,
  calculateGst,
  calculateOrderGst,
  isValidGstin,
  DEFAULT_GST_RATE,
} from "../utils/gstCalc";

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

export default function AddDevices() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const phones = useAppSelector((s) => s.inventory.phones);
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();
  const { tenant } = useAuth();

  const DEVICE_LIMIT = 100;

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
  const [selectedPlatform, setSelectedPlatform] = useState("");

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstInclusive, setGstInclusive] = useState(true);
  const [sellerGstin, setSellerGstin] = useState("");

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

  const gstType = useMemo(
    () => determineGstType(sellerGstin || vendor?.gstin, tenant?.gstin),
    [sellerGstin, vendor?.gstin, tenant?.gstin],
  );
  const gstBreakdown = useMemo(() => {
    if (!gstEnabled || rows.length === 0) return null;
    const prices = rows.map((r) => parseFloat(r.purchasePrice) || 0).filter(Boolean);
    if (prices.length === 0) return null;
    return calculateOrderGst(prices, DEFAULT_GST_RATE, gstType, gstInclusive);
  }, [gstEnabled, rows, gstType, gstInclusive]);

  // ── Row helpers ────────────────────────────────────────────────────────────
  const updateRow = useCallback((id: string, patch: Partial<DeviceRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = (id: string) => {
    if (rows.length > 1) setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const customers = useAppSelector((state) => state.customers.customers);

  const handleSubmit = () => {
    if (isSubmitting) return;
    // Enforce 100-device cap for Starter plan
    if (!canUse("unlimited_phones") && phones.length + rows.length > DEVICE_LIMIT) {
      showUpgrade("unlimited_phones");
      return;
    }
    // Determine effective counterparty
    let effectiveVendor = vendor;
    if (channel === "PLATFORM") {
      // Find the 'Platforms' generic customer if exists
      effectiveVendor = customers.find(c =>
        c.name.toLowerCase().includes("platform")
      ) ?? null;
      
      if (!effectiveVendor && customers.length > 0) {
        // Fallback to first vendor if no platform account found
        effectiveVendor = customers[0];
      }
    }

    if (!effectiveVendor) return toast.error(channel === "PLATFORM" ? "Please create a customer named 'Platforms' first" : "Please select a supplier");
    
    if (channel === "PLATFORM" && !selectedPlatform) {
      return toast.error("Please select a platform (Cashify, OLX, etc.)");
    }
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

    const poItems: PurchaseOrderItem[] = rows.map((r) => {
      const base = {
        id: crypto.randomUUID(),
        purchaseOrderId: poId,
        phoneId: r.id,
        purchasePrice: parseFloat(r.purchasePrice) || 0,
        status: "ACCEPTED" as const,
      };
      if (gstEnabled) {
        const p = parseFloat(r.purchasePrice) || 0;
        const ig = calculateGst(p, DEFAULT_GST_RATE, gstType, gstInclusive);
        return { ...base, hsnCode: "8517", gstRate: DEFAULT_GST_RATE, taxableValue: ig.taxableValue, cgstAmount: ig.cgstAmount, sgstAmount: ig.sgstAmount, igstAmount: ig.igstAmount };
      }
      return base;
    });

    const po: PurchaseOrder = {
      id: poId,
      counterpartyId: effectiveVendor.id,
      acquisitionChannel: channel,
      platformName: channel === "PLATFORM" ? selectedPlatform : undefined,
      platformFee,
      phonesOrdered: rows.length,
      phonesReceived: rows.length,
      totalAmount: grandTotal,
      amountPaid: totalPaid,
      status: outstanding <= 0 ? "SETTLED" : "PARTIAL",
      dueDate: dueDateStr || undefined,
      notes: channel === "PLATFORM" ? `Source: ${selectedPlatform}` : undefined,
      createdAt: ts,
      ...(gstEnabled && gstBreakdown
        ? {
            gstEnabled: true,
            gstInclusive,
            gstType,
            gstRate: DEFAULT_GST_RATE,
            subtotal: gstBreakdown.subtotal,
            cgstAmount: gstBreakdown.cgstTotal,
            sgstAmount: gstBreakdown.sgstTotal,
            igstAmount: gstBreakdown.igstTotal,
            sellerGstin: sellerGstin.trim().toUpperCase() || vendor?.gstin || undefined,
          }
        : {}),
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
          counterpartyId: effectiveVendor!.id,
          totalPaid: totalPaid,
          mode: "CASH", // Future: support other modes natively here
          paidAt: ts,
          recordedBy: effectiveVendor!.id,
          allocations: [{ purchaseOrderId: poId, amountAllocated: totalPaid }],
        }),
      );
    }

    // Resulting wallet impact will be handled by the create_purchase_order RPC (SUPPLIER_PAYMENT).

    setIsSubmitting(true);
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
                  : "Platform Name"}
              </label>
              {channel === "DIRECT" ? (
                <CustomerPicker selectedId={vendor?.id} onSelect={(v) => { setVendor(v); setSellerGstin(v.gstin || ""); }} />
              ) : (
                <Autocomplete
                  data={PLATFORM_CATALOG}
                  value={selectedPlatform}
                  onChange={setSelectedPlatform}
                  placeholder="Select Platform (Cashify, OLX...)"
                  icon={<Building size={16} />}
                />
              )}
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

        {/* ─── GST Section (optional) ─────────────────────────────────────── */}
        {tenant?.gstin && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Receipt size={15} className="text-emerald-600" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">Apply GST</p>
                  <p className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                    {gstEnabled
                      ? `18% ${gstInclusive ? "inclusive" : "exclusive"} · HSN 8517 · ${gstType === "IGST" ? "IGST" : "CGST + SGST"}`
                      : "Record input tax on this purchase (optional)"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={gstEnabled}
                onClick={() => setGstEnabled((v) => !v)}
                className={clsx(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                  gstEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700",
                )}
              >
                <span className={clsx("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", gstEnabled ? "translate-x-6" : "translate-x-1")} />
              </button>
            </div>

            {gstEnabled && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-500">Your GSTIN</span>
                  <span className="font-black text-slate-700 dark:text-slate-300 font-mono">{tenant.gstin}</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">
                    Supplier GSTIN <span className="font-normal normal-case text-slate-400">(optional — for ITC)</span>
                  </label>
                  <input
                    type="text"
                    value={sellerGstin}
                    onChange={(e) => setSellerGstin(e.target.value.toUpperCase())}
                    maxLength={15}
                    placeholder={vendor?.gstin || "e.g. 27AAACR5055K1ZF"}
                    className={clsx(
                      "w-full h-10 px-3 rounded-xl border-2 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all bg-slate-50 dark:bg-slate-800",
                      sellerGstin.length === 15
                        ? isValidGstin(sellerGstin) ? "border-emerald-400 focus:border-emerald-500" : "border-rose-400 focus:border-rose-500"
                        : "border-slate-100 dark:border-slate-700 focus:border-emerald-400",
                    )}
                  />
                  {sellerGstin.length === 15 && !isValidGstin(sellerGstin) && (
                    <p className="text-[10px] text-rose-500 font-semibold mt-1">Invalid GSTIN format</p>
                  )}
                </div>
                <div className={clsx(
                  "flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold",
                  gstType === "IGST" ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400" : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
                )}>
                  <span>{gstType === "IGST" ? "Inter-state purchase → IGST" : "Intra-state purchase → CGST + SGST"}</span>
                  <span>{DEFAULT_GST_RATE}%</span>
                </div>

                {/* Inclusive / Exclusive pricing mode */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                  <button
                    type="button"
                    onClick={() => setGstInclusive(true)}
                    className={clsx(
                      "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors",
                      gstInclusive
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    Inclusive
                  </button>
                  <button
                    type="button"
                    onClick={() => setGstInclusive(false)}
                    className={clsx(
                      "flex-1 text-[10px] font-bold py-1.5 rounded-md transition-colors",
                      !gstInclusive
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                        : "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    Exclusive
                  </button>
                </div>

                {gstBreakdown && (
                  <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Taxable Value</span>
                      <span className="font-bold">₹{gstBreakdown.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                    {gstType === "CGST_SGST" ? (
                      <>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>CGST (9%)</span>
                          <span className="font-bold">₹{gstBreakdown.cgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-500">
                          <span>SGST (9%)</span>
                          <span className="font-bold">₹{gstBreakdown.sgstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>IGST (18%)</span>
                        <span className="font-bold">₹{gstBreakdown.igstTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] font-black text-slate-700 dark:text-slate-300 border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                      <span>{gstInclusive ? "Total (incl. tax)" : "Total + Tax"}</span>
                      <span>₹{gstBreakdown.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Submit ─────────────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full bg-primary-500 hover:bg-blue-800 text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Package size={20} strokeWidth={2.5} />}
          {isSubmitting ? "Processing…" : "Commit Bulk Ingest"}
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

        <IssueSelector
          selectedTags={row.selectedTags}
          onToggleTag={toggleTag}
          topIssues={topIssues}
          tagQuery={row.tagQuery || ""}
          setTagQuery={(q) => onUpdate({ tagQuery: q })}
          showIssues={showIssues}
          setShowIssues={setShowIssues}
          className="pt-3 border-t border-slate-50 dark:border-slate-800"
        />
      </div>
    </div>
  );
}
