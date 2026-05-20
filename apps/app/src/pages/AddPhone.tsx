import React, { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addPhone, linkPhoneToPO } from "../features/inventory/slice";
import { addPurchaseOrder } from "../features/purchasing/slice";
import { useNavigate } from "react-router-dom";
import {
  addBrand,
  addModel,
  addColorOption,
  addIssueTag,
  addRamOption,
  addStorageOption,
} from "../features/masterData/slice";
import { toast } from "sonner";
import { Phone } from "../features/inventory/types";
import {
  PurchaseOrderStatus,
  POItemStatus,
} from "../features/purchasing/types";
import {
  useDeviceCatalog,
  sortBySize,
  type ColorOption,
} from "../hooks/useDeviceCatalog";
import { CatalogAutocomplete } from "../components/ui/CatalogAutocomplete";
import Autocomplete from "../components/ui/Autocomplete";
import { issuesFlatList, severityColorMap } from "../data/issueCatalog";
import ImeiSection from "../components/ImeiSection";
import { type ImeiEntry, validateImei } from "../utils/validateImei";
import CurrencyInput from "../components/ui/CurrencyInput";
import { CustomerPicker } from "../components/ui/CustomerPicker";
import clsx from "clsx";
import {
  Smartphone,
  Cpu,
  Wrench,
  DollarSign,
  ChevronLeft,
  Check,
  Plus,
  MonitorSmartphone,
  MemoryStick,
  Palette,
  Search,
  HardDrive,
  ChevronDown,
  ChevronUp,
  Files,
  Package,
  ArrowRight,
  Receipt,
} from "lucide-react";
import { BulkDeviceEntrySheet } from "../components/shared/BulkDeviceEntrySheet";

import { usePlan } from "../hooks/usePlan";
import { useAuth } from "../context/AuthContext";
import {
  determineGstType,
  calculateGst,
  calculateOrderGst,
  isValidGstin,
  DEFAULT_GST_RATE,
} from "../utils/gstCalc";

// ─── Validation (simple, no zod overhead on every render) ────────────────────

type FormErrors = Partial<
  Record<"brand" | "model" | "storage" | "color" | "purchasePrice", string>
>;

function validate(
  brand: string,
  model: string,
  storage: string,
  color: string,
  price: number | undefined,
): FormErrors {
  const errs: FormErrors = {};
  if (!brand.trim()) errs.brand = "Required";
  if (!model.trim()) errs.model = "Required";
  if (!storage.trim()) errs.storage = "Required";
  if (!color.trim()) errs.color = "Required";
  if (!price || price <= 0) errs.purchasePrice = "Must be greater than 0";
  return errs;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddPhone() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const masterData = useAppSelector((state) => state.masterData);
  const phones = useAppSelector((state) => state.inventory.phones);

  const topIssues = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    phones.forEach((p) => {
      p.issueTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    if (sortedTags.length >= 5) {
      return sortedTags.slice(0, 5);
    }

    const fallback = [
      "Cracked / Shattered Screen",
      "Battery Draining Fast",
      "Scuff Marks",
      "Deep Scratch on Screen",
      "Body Discolouration / Yellowing",
    ];

    return [...new Set([...sortedTags, ...fallback])].slice(0, 5);
  }, [phones]);

  const {
    getBrandOptions,
    getModelOptions,
    getRamOptions,
    getStorageOptions,
    getColorOptions,
    isCatalogBrand,
    isCatalogModel,
  } = useDeviceCatalog();

  // ── Form state ──
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState<string>("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // ── IMEI state ────────────────────────────────────────────────────────────
  const [imeis, setImeis] = useState<ImeiEntry[]>([
    { value: "", status: "UNVERIFIED" },
  ]);

  // PO flow state
  const [showBatchAdd, setShowBatchAdd] = useState(false);

  // Supplier section state - MANDATORY
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { isExpired } = usePlan();
  const { tenant } = useAuth();

  // ── Pre-select Generic Cash Supplier ───────────────────────────────────────
  useEffect(() => {
    const GENERIC_CASH_ID = "00000000-0000-0000-0000-000000000001";
    setSelectedSupplier({ id: GENERIC_CASH_ID, name: "Generic Cash Supplier" });
  }, []);

  const [acquisitionChannel, setAcquisitionChannel] = useState<
    "DIRECT" | "PLATFORM" | "INTER_TENANT"
  >("DIRECT");
  const [platformName, setPlatformName] = useState("");
  const [platformFeeStr, setPlatformFeeStr] = useState("");
  const [paymentMode, setPaymentMode] = useState<
    "CASH" | "UPI" | "BANK_TRANSFER" | "CREDIT"
  >("CASH");
  const [amountPaidStr, setAmountPaidStr] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");
  // ── GST (purchase input tax) ───────────────────────────────────────────────────────
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstInclusive, setGstInclusive] = useState(true);
  const [sellerGstin, setSellerGstin] = useState("");

  // Sync GSTIN from supplier profile whenever supplier changes
  useEffect(() => {
    setSellerGstin(selectedSupplier?.gstin || "");
  }, [selectedSupplier?.id]);

  const gstType = useMemo(
    () => determineGstType(sellerGstin || selectedSupplier?.gstin, tenant?.gstin),
    [sellerGstin, selectedSupplier?.gstin, tenant?.gstin],
  );
  const gstBreakdown = useMemo(() => {
    const p = parseFloat(price) || 0;
    if (!gstEnabled || p === 0) return null;
    return calculateOrderGst([p], DEFAULT_GST_RATE, gstType, gstInclusive);
  }, [gstEnabled, price, gstType, gstInclusive]);

  // ── Autofill Logic ──
  useEffect(() => {
    let active = true;
    async function checkImei() {
      const validImei = imeis.find((i) => i.value.length === 15)?.value;
      if (!validImei) return;

      const existingPhone = phones.find((p) => p.imeis?.includes(validImei));
      let foundBrand = "", foundModel = "", foundRam = "", foundStorage = "", foundColor = "";

      if (existingPhone) {
        foundBrand = existingPhone.brand;
        foundModel = existingPhone.model;
        foundRam = existingPhone.ram;
        foundStorage = existingPhone.storage;
        foundColor = existingPhone.color;
      } else {
        const { data, error } = await supabase
          .from("phones")
          .select("brand, model, ram, storage, color")
          .contains("imeis", [validImei])
          .maybeSingle();

        if (data && !error && active) {
          foundBrand = data.brand;
          foundModel = data.model;
          foundRam = data.ram;
          foundStorage = data.storage;
          foundColor = data.color;
        }
      }

      if (foundBrand && active) {
        if (brand !== foundBrand) setBrand(foundBrand);
        if (model !== foundModel) setModel(foundModel);
        if (ram !== foundRam) setRam(foundRam);
        if (storage !== foundStorage) setStorage(foundStorage);
        if (color !== foundColor) setColor(foundColor);
      }
    }
    checkImei();
    return () => { active = false; };
  }, [imeis, phones, brand, model, ram, storage, color]);

  // ─── Derived options ───
  const brandOptions = useMemo(() => getBrandOptions(), [getBrandOptions]);
  const modelOptions = useMemo(() => getModelOptions(brand), [brand, getModelOptions]);
  const ramOptions = useMemo(() => sortBySize(getRamOptions(brand, model)), [brand, model, getRamOptions]);
  const storageOptions = useMemo(() => sortBySize(getStorageOptions(brand, model)), [brand, model, getStorageOptions]);
  const colorOptions = useMemo(() => getColorOptions(brand, model), [brand, model, getColorOptions]);
  const modelInCatalog = useMemo(() => isCatalogModel(brand, model), [brand, model, isCatalogModel]);

  const handleBrandChange = useCallback((newBrand: string) => {
    setBrand(newBrand);
    setModel(""); setRam(""); setStorage(""); setColor("");
  }, []);

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
    setRam(""); setStorage(""); setColor("");
  }, []);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);

    const priceNum = price !== "" ? parseFloat(price) : undefined;
    const errs = validate(brand, model, storage, color, priceNum);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    if (isExpired) {
      toast.error("Subscription Expired", {
        description: "Please renew your subscription to add new devices.",
      });
      return;
    }

    if (!selectedSupplier) {
      toast.error("Purchase Source Required");
      return;
    }

    const filledImeis = imeis.filter((e) => e.value.length > 0);
    if (filledImeis.length === 0) {
      toast.error("IMEI Required");
      return;
    }

    const hasInvalidImei = filledImeis.some((e) => validateImei(e.value) !== null);
    if (hasInvalidImei) {
      toast.error("Invalid IMEI");
      return;
    }

    // Persist to masterData
    if (!isCatalogBrand(brand) && !masterData.brands.includes(brand)) dispatch(addBrand(brand));
    if (!isCatalogModel(brand, model) && !masterData.models.includes(model)) dispatch(addModel(model));
    if (!getColorOptions(brand, model).find((c) => c.label === color) && !masterData.colorOptions.includes(color)) dispatch(addColorOption(color));
    if (ram && !getRamOptions(brand, model).includes(ram) && !masterData.ramOptions.includes(ram)) dispatch(addRamOption(ram));
    if (!getStorageOptions(brand, model).includes(storage) && !masterData.storageOptions.includes(storage)) dispatch(addStorageOption(storage));

    const newPhone: Phone = {
      id: crypto.randomUUID(),
      brand, model, ram: ram || "N/A", storage, color,
      imeis: filledImeis.map((e) => e.value).slice(0, 2),
      purchasePrice: parseFloat(price),
      status: "PENDING",
      issueTags: selectedTags,
      createdAt: new Date().toISOString(),
    };

    dispatch(addPhone(newPhone));
    
    // Create PO
    const poId = crypto.randomUUID();
    const platformFeeAmount = acquisitionChannel === "PLATFORM" ? parseFloat(platformFeeStr) || 0 : 0;
    const baseCost = gstEnabled && gstBreakdown ? gstBreakdown.grandTotal : parseFloat(price);
    const totalAmount = baseCost + platformFeeAmount;
    const amountPaidNum = parseFloat(amountPaidStr) || 0;

    const purchaseOrder = {
      id: poId,
      counterpartyId: selectedSupplier.id,
      acquisitionChannel,
      platformName: acquisitionChannel === "PLATFORM" ? platformName : undefined,
      platformFee: platformFeeAmount,
      phonesOrdered: 1,
      phonesReceived: 0,
      totalAmount,
      amountPaid: amountPaidNum,
      status: "AWAITING_RECEIPT" as PurchaseOrderStatus,
      paymentMode,
      dueDate: dueDateStr || undefined,
      notes: "",
      createdAt: new Date().toISOString(),
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
            sellerGstin: sellerGstin.trim().toUpperCase() || selectedSupplier.gstin || undefined,
          }
        : {}),
      items: [
        {
          id: crypto.randomUUID(),
          purchaseOrderId: poId,
          phoneId: newPhone.id,
          purchasePrice: parseFloat(price),
          status: "PENDING_INSPECTION" as POItemStatus,
          ...(gstEnabled && gstBreakdown ? (() => {
            const ig = calculateGst(parseFloat(price), DEFAULT_GST_RATE, gstType, gstInclusive);
            return { hsnCode: "8517", gstRate: DEFAULT_GST_RATE, taxableValue: ig.taxableValue, cgstAmount: ig.cgstAmount, sgstAmount: ig.sgstAmount, igstAmount: ig.igstAmount };
          })() : {}),
        },
      ],
    };

    dispatch(addPurchaseOrder(purchaseOrder));
    dispatch(linkPhoneToPO({ phoneId: newPhone.id, purchaseOrderId: poId }));

    navigate("/inventory");
    toast.success("Device Added", {
      description: `${brand} ${model} linked to PO.`,
    });
  };

  const revalidate = () => {
    if (!touched) return;
    const priceNum = price !== "" ? parseFloat(price) : undefined;
    setErrors(validate(brand, model, storage, color, priceNum));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleReset = () => {
    setBrand(""); setModel(""); setRam(""); setStorage(""); setColor(""); setPrice("");
    setSelectedTags([]); setImeis([{ value: "", status: "UNVERIFIED" }]);
    setErrors({}); setTouched(false);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 relative">
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-end shadow-sm gap-3">
        <button
          type="button"
          onClick={() => setShowBatchAdd(true)}
          className="flex items-center gap-1.5 bg-primary-500/10 hover:bg-primary-500/20 text-primary-500 dark:bg-blue-900/40 dark:hover:bg-blue-900/60 dark:text-blue-400 font-bold text-xs px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <Files size={14} /> Batch PO
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-bold text-sm px-2 py-1 rounded-lg transition-colors"
        >
          Reset
        </button>
      </div>

      <main className="w-full max-w-lg mx-auto p-4 pb-24 h-full overflow-y-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <ImeiSection imeis={imeis} onChange={setImeis} />

          {/* Details */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="text-primary-500" size={18} strokeWidth={2.5} />
              Device Details
            </h3>
            <CatalogAutocomplete
              label="Brand"
              options={brandOptions}
              value={brand}
              onChange={(v) => { handleBrandChange(v); revalidate(); }}
              placeholder="e.g. Apple..."
              icon={<MonitorSmartphone size={17} />}
              error={errors.brand}
            />
            <CatalogAutocomplete
              label="Model"
              options={modelOptions}
              value={model}
              onChange={(v) => { handleModelChange(v); revalidate(); }}
              placeholder={brand ? `Search ${brand} models...` : "Select brand first"}
              icon={<Search size={17} />}
              disabled={!brand}
              error={errors.model}
            />
            {modelInCatalog && (
              <p className="text-[10px] font-semibold text-primary-500/70 flex items-center gap-1 -mt-2">
                <Check size={11} strokeWidth={3} /> Catalog model loaded
              </p>
            )}
          </div>

          {/* Specs */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="text-primary-500" size={18} strokeWidth={2.5} />
              Specs
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <CatalogAutocomplete
                label="RAM" optional options={ramOptions} value={ram} onChange={setRam} placeholder="8GB"
                icon={<MemoryStick size={17} />} disabled={!model}
              />
              <CatalogAutocomplete
                label="Storage" options={storageOptions} value={storage} onChange={(v) => { setStorage(v); revalidate(); }}
                placeholder="256GB" icon={<HardDrive size={17} />} disabled={!model} error={errors.storage}
              />
            </div>
            <CatalogAutocomplete
              label="Color" options={colorOptions} value={color} onChange={(v) => { setColor(v); revalidate(); }}
              placeholder="Midnight Gray" icon={<Palette size={17} />} disabled={!model} error={errors.color}
            />
          </div>

          {/* Issues */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Wrench className="text-primary-500" size={18} strokeWidth={2.5} />
              Condition
            </h3>
            <div className="flex flex-wrap gap-2">
              {topIssues.map(tag => (
                <button
                  key={tag} type="button" onClick={() => toggleTag(tag)}
                  className={clsx(
                    "px-3 py-2 border rounded-xl text-xs font-semibold transition-all",
                    selectedTags.includes(tag) 
                      ? "bg-primary-500 border-primary-500 text-white" 
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-600"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Finance */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign className="text-primary-500" size={18} strokeWidth={2.5} />
              Finance
            </h3>
            <div className="relative">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Purchase Cost</label>
              <CurrencyInput value={price} onChange={(v) => { setPrice(v); revalidate(); }} />
              {errors.purchasePrice && <span className="text-red-500 text-xs mt-1 block">{errors.purchasePrice}</span>}
            </div>
          </div>

          {/* Purchase Source (Mandatory) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="text-primary-500" size={18} strokeWidth={2.5} />
              Purchase Source
            </h3>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Supplier / Channel</label>
              <CustomerPicker 
                selectedId={selectedSupplier?.id} 
                onSelect={(v) => { setSelectedSupplier(v); setSellerGstin(v.gstin || ""); }} 
              />
            </div>

            {selectedSupplier && (
              <div className="pt-4 border-t border-slate-50 dark:border-slate-800 space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Payment Status</label>
                  <div className="flex gap-2">
                    {["CASH", "UPI", "CREDIT"].map(m => (
                      <button
                        key={m} type="button" onClick={() => setPaymentMode(m as any)}
                        className={clsx(
                          "px-3 py-2 rounded-xl text-xs font-bold border",
                          paymentMode === m ? "bg-slate-900 text-white" : "bg-white text-slate-600"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── GST Section (optional) ────────────────────────────────────── */}
          {tenant?.gstin && selectedSupplier && (
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
                      placeholder="e.g. 27AAACR5055K1ZF"
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

          <div className="pt-4 pb-10">
            <button
              type="submit"
              className="w-full bg-primary-500 hover:bg-primary-600 text-white py-4 rounded-xl font-black text-sm shadow-xl shadow-primary-500/20 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Check size={18} strokeWidth={3} />
              Save Device & Create PO
            </button>
          </div>
        </form>
      </main>

      <BulkDeviceEntrySheet
        open={showBatchAdd}
        onOpenChange={setShowBatchAdd}
      />
    </div>
  );
}
