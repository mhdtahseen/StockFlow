import React, { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addPhone, linkPhoneToPO } from "../features/inventory/slice";
import { addEntry } from "../features/ledger/slice";
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
import ReusableAutocomplete from "../components/ui/ReusableAutocomplete";
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
} from "lucide-react";
import { BatchAddSheet } from "../components/shared/BatchAddSheet";

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

// ─── Static options (computed once at module level, never on render) ──────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddPhone() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const masterData = useAppSelector((state) => state.masterData);
  const phones = useAppSelector((state) => state.inventory.phones);

  const topIssues = useMemo(() => {
    // Collect all tags from inventory
    const tagCounts: Record<string, number> = {};
    phones.forEach((p) => {
      p.issueTags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    // Sort by descending frequency
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    if (sortedTags.length >= 5) {
      return sortedTags.slice(0, 5);
    }

    // Fallback if not enough history
    const fallback = [
      "Cracked / Shattered Screen",
      "Battery Draining Fast",
      "Scuff Marks",
      "Deep Scratch on Screen",
      "Body Discolouration / Yellowing",
    ];

    // Merge history + fallback, distinct, limit 5
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

  // ── Form state (controlled, not RHF — gives us full sync control) ──
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

  // Supplier section state
  const [showSupplierSection, setShowSupplierSection] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
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

  // ── Autofill from existing inventory ──────────────────────────────────────
  useEffect(() => {
    let active = true;

    async function checkImei() {
      // Find the first valid 15-digit IMEI currently entered
      const validImei = imeis.find((i) => i.value.length === 15)?.value;
      if (!validImei) return;

      // 1. Search the Redux store first
      let foundBrand = "";
      let foundModel = "";
      let foundRam = "";
      let foundStorage = "";
      let foundColor = "";

      const existingPhone = phones.find((p) => p.imeis?.includes(validImei));

      if (existingPhone) {
        foundBrand = existingPhone.brand;
        foundModel = existingPhone.model;
        foundRam = existingPhone.ram;
        foundStorage = existingPhone.storage;
        foundColor = existingPhone.color;
      } else {
        // 2. Fallback: Search the DB directly
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

    return () => {
      active = false;
    };
  }, [imeis, phones, brand, model, ram, storage, color]);

  // ─── Derived options (memoized, catalog-only) ───────────────────────────────

  /** Brand list — catalog only, computed once */
  const brandOptions = useMemo<string[]>(
    () => getBrandOptions(),
    [getBrandOptions],
  );

  /** Model list — only recomputed when brand changes */
  const modelOptions = useMemo<string[]>(
    () => getModelOptions(brand),
    [brand, getModelOptions],
  );

  /** RAM options — recomputed only when brand+model change */
  const ramOptions = useMemo<string[]>(
    () => sortBySize(getRamOptions(brand, model)),
    [brand, model, getRamOptions],
  );

  /** Storage options — recomputed only when brand+model change */
  const storageOptions = useMemo<string[]>(
    () => sortBySize(getStorageOptions(brand, model)),
    [brand, model, getStorageOptions],
  );

  /** Color options — recomputed only when brand+model change */
  const colorOptions = useMemo<ColorOption[]>(
    () => getColorOptions(brand, model),
    [brand, model, getColorOptions],
  );

  // true only if the selected model is fully in the catalog (enables model-locked dropdowns)
  const modelInCatalog = useMemo(
    () => isCatalogModel(brand, model),
    [brand, model, isCatalogModel],
  );

  // ─── Brand change → reset all downstream fields ───────────────────────────

  const handleBrandChange = useCallback((newBrand: string) => {
    setBrand(newBrand);
    setModel("");
    setRam("");
    setStorage("");
    setColor("");
  }, []);

  // ─── Model change → reset storage, color, ram ─────────────────────────────

  const handleModelChange = useCallback((newModel: string) => {
    setModel(newModel);
    setRam("");
    setStorage("");
    setColor("");
  }, []);

  // ─── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    setTouched(true);

    const priceNum = price !== "" ? parseFloat(price) : undefined;
    const errs = validate(brand, model, storage, color, priceNum);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // IMEI Validation (Mandatory field now)
    const filledImeis = imeis.filter((e) => e.value.length > 0);

    if (filledImeis.length === 0) {
      toast.error("IMEI Required", {
        description: "Please enter or scan at least one IMEI number.",
      });
      return;
    }

    const hasInvalidImei = filledImeis.some(
      (e) => validateImei(e.value) !== null,
    );
    if (hasInvalidImei) {
      toast.error("Invalid IMEI", {
        description: "Please fix or remove invalid IMEI entries.",
      });
      return;
    }

    // Persist any custom values to masterData
    if (!isCatalogBrand(brand) && !masterData.brands.includes(brand))
      dispatch(addBrand(brand));
    if (!isCatalogModel(brand, model) && !masterData.models.includes(model))
      dispatch(addModel(model));
    if (
      !getColorOptions(brand, model).find((c) => c.label === color) &&
      !masterData.colorOptions.includes(color)
    )
      dispatch(addColorOption(color));
    if (
      ram &&
      !getRamOptions(brand, model).includes(ram) &&
      !masterData.ramOptions.includes(ram)
    )
      dispatch(addRamOption(ram));
    if (
      !getStorageOptions(brand, model).includes(storage) &&
      !masterData.storageOptions.includes(storage)
    )
      dispatch(addStorageOption(storage));
    selectedTags.forEach((tag) => {
      if (!masterData.issueTags.includes(tag)) dispatch(addIssueTag(tag));
    });

    const newPhone: Phone = {
      id: crypto.randomUUID(),
      brand,
      model,
      ram: ram || "N/A",
      storage,
      color,
      imeis: filledImeis.map((e) => e.value).slice(0, 2),
      purchasePrice: parseFloat(price),
      status: "PENDING",
      issueTags: selectedTags,
      createdAt: new Date().toISOString(),
    };

    dispatch(addPhone(newPhone));
    dispatch(
      addEntry({
        id: crypto.randomUUID(),
        type: "FUNDS_PLEDGED",
        referenceId: newPhone.id,
        amount: parseFloat(price),
        createdAt: new Date().toISOString(),
      }),
    );

    // PO-aware logic: if supplier is selected, create a PO and link the phone
    if (selectedSupplier) {
      const poId = crypto.randomUUID();
      const platformFeeAmount =
        acquisitionChannel === "PLATFORM" ? parseFloat(platformFeeStr) || 0 : 0;
      const totalAmount = parseFloat(price) + platformFeeAmount;
      const amountPaidNum = parseFloat(amountPaidStr) || 0;

      const purchaseOrder = {
        id: poId,
        counterpartyId: selectedSupplier.id,
        acquisitionChannel,
        platformName:
          acquisitionChannel === "PLATFORM" ? platformName : undefined,
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
        items: [
          {
            id: crypto.randomUUID(),
            purchaseOrderId: poId,
            phoneId: newPhone.id,
            purchasePrice: parseFloat(price),
            status: "PENDING_INSPECTION" as POItemStatus,
          },
        ],
      };

      dispatch(addPurchaseOrder(purchaseOrder));
      dispatch(linkPhoneToPO({ phoneId: newPhone.id, purchaseOrderId: poId }));
    }

    navigate("/inventory");
    toast.success("Device Added", {
      description: `${brand} ${model} has been added to your pending inventory.${selectedSupplier ? " Purchase order created." : ""}`,
    });
  };

  // ─── Re-validate on change when form has been submitted once ─────────────

  const revalidate = () => {
    if (!touched) return;
    const priceNum = price !== "" ? parseFloat(price) : undefined;
    setErrors(validate(brand, model, storage, color, priceNum));
  };

  // ─── Issue tags ───────────────────────────────────────────────────────────

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleAddCustomTag = (
    e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent,
  ) => {
    if (("key" in e && e.key === "Enter") || e.type === "click") {
      e.preventDefault();
      if (newTag.trim()) {
        const t = newTag.trim();
        if (!selectedTags.includes(t)) setSelectedTags([...selectedTags, t]);
        setNewTag("");
      }
    }
  };

  const handleReset = () => {
    setBrand("");
    setModel("");
    setRam("");
    setStorage("");
    setColor("");
    setPrice("");
    setSelectedTags([]);
    setImeis([{ value: "", status: "UNVERIFIED" }]);
    setErrors({});
    setTouched(false);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300 relative">
      {/* Header */}
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

      <main className="w-full max-w-lg mx-auto p-4 pb-12 z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── IMEI ────────────────────────────────────────────────────── */}
          <ImeiSection imeis={imeis} onChange={setImeis} />

          {/* ── Device Details ───────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone
                className="text-primary-500"
                size={18}
                strokeWidth={2.5}
              />
              Device Details
            </h3>

            {/* Brand */}
            <CatalogAutocomplete
              label="Brand"
              options={brandOptions}
              value={brand}
              onChange={(v) => {
                handleBrandChange(v);
                revalidate();
              }}
              placeholder="e.g. Apple, Samsung…"
              icon={<MonitorSmartphone size={17} />}
              error={errors.brand}
            />

            {/* Model */}
            <CatalogAutocomplete
              label="Model"
              options={modelOptions}
              value={model}
              onChange={(v) => {
                handleModelChange(v);
                revalidate();
              }}
              placeholder={
                brand ? `Search ${brand} models…` : "Select brand first"
              }
              icon={<Search size={17} />}
              disabled={!brand}
              error={errors.model}
            />

            {/* Hint when model is locked to catalog */}
            {modelInCatalog && (
              <p className="text-[10px] font-semibold text-primary-500/70 dark:text-blue-400/70 flex items-center gap-1 -mt-2">
                <Check size={11} strokeWidth={3} />
                Catalog model — storage & colors auto-loaded
              </p>
            )}
          </div>

          {/* ── Specifications ───────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="text-primary-500" size={18} strokeWidth={2.5} />
              Specifications
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* RAM */}
              <CatalogAutocomplete
                label="RAM"
                optional
                options={ramOptions}
                value={ram}
                onChange={setRam}
                placeholder="e.g. 8GB"
                icon={<MemoryStick size={17} />}
                disabled={!model}
              />

              {/* Storage */}
              <CatalogAutocomplete
                label="Storage"
                options={storageOptions}
                value={storage}
                onChange={(v) => {
                  setStorage(v);
                  revalidate();
                }}
                placeholder="e.g. 256GB"
                icon={<HardDrive size={17} />}
                disabled={!model}
                error={errors.storage}
              />
            </div>

            {/* Color */}
            <CatalogAutocomplete
              label="Color"
              options={colorOptions}
              value={color}
              onChange={(v) => {
                setColor(v);
                revalidate();
              }}
              placeholder={
                modelInCatalog
                  ? "Choose from catalog colors…"
                  : "e.g. Midnight Green"
              }
              icon={<Palette size={17} />}
              disabled={!model}
              error={errors.color}
            />

            {/* Color preview swatch for chosen color */}
            {color &&
              (() => {
                const matched = colorOptions.find((c) => c.label === color);
                if (!matched) return null;
                return (
                  <div className="flex items-center gap-2 -mt-2 pl-0.5">
                    <span
                      className="size-3.5 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                      style={{ backgroundColor: matched.hex }}
                    />
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {matched.hex}
                    </span>
                  </div>
                );
              })()}
          </div>

          {/* ── Condition & Issues ────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench
                  className="text-primary-500"
                  size={18}
                  strokeWidth={2.5}
                />
                Condition &amp; Issues
              </h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                Tap tags
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {(() => {
                const hasManySelected = selectedTags.length > 3;
                let chipsToRender: string[] = [];

                if (isIssuesExpanded) {
                  chipsToRender = [...new Set([...topIssues, ...selectedTags])];
                } else {
                  if (hasManySelected) {
                    chipsToRender = selectedTags.slice(-3); // Show 3 latest
                  } else {
                    chipsToRender = [
                      ...new Set([...topIssues, ...selectedTags]),
                    ];
                  }
                }

                const hiddenCount =
                  hasManySelected && !isIssuesExpanded
                    ? selectedTags.length - 3
                    : 0;

                return (
                  <>
                    {chipsToRender.map((tag) => {
                      const isSelected = selectedTags.includes(tag);
                      // Find severity from catalog, default to 1 if custom
                      const catalogItem = issuesFlatList.find(
                        (i) => i.label === tag || i.aliases?.includes(tag),
                      );
                      const severity = catalogItem?.severity || 1;
                      const severityColors = severityColorMap[severity];

                      let baseStyle =
                        "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600";

                      let inlineStyle = {};

                      if (isSelected) {
                        baseStyle = "font-bold";
                        inlineStyle = {
                          backgroundColor: severityColors.bg,
                          color: severityColors.text,
                          borderColor: severityColors.text + "40", // 25% opacity for border
                        };
                      }

                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleTag(tag)}
                          style={inlineStyle}
                          className={clsx(
                            "group flex items-center gap-1.5 px-3.5 py-2 border rounded-xl text-xs font-semibold transition-all active:scale-95",
                            baseStyle,
                          )}
                        >
                          <span>{tag}</span>
                          {isSelected ? (
                            <Check
                              size={14}
                              strokeWidth={3}
                              className="opacity-80"
                            />
                          ) : (
                            <Plus size={14} className="opacity-40" />
                          )}
                        </button>
                      );
                    })}

                    {hasManySelected && (
                      <button
                        type="button"
                        onClick={() => setIsIssuesExpanded(!isIssuesExpanded)}
                        className="group flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold transition-all active:scale-95 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                      >
                        {!isIssuesExpanded ? (
                          <>
                            <span>+{hiddenCount} More</span>
                            <ChevronDown size={14} className="opacity-60" />
                          </>
                        ) : (
                          <>
                            <span>Show Less</span>
                            <ChevronUp size={14} className="opacity-60" />
                          </>
                        )}
                      </button>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 mt-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Custom Issue
              </label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <ReusableAutocomplete
                    data={issuesFlatList}
                    value={newTag}
                    onChange={setNewTag}
                    onSelect={(val) => {
                      const t = val.trim();
                      if (t && !selectedTags.includes(t)) {
                        setSelectedTags((prev) => [...prev, t]);
                      }
                      setNewTag("");
                    }}
                    placeholder="Search catalog or type custom issue..."
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    const t = newTag.trim();
                    if (t && !selectedTags.includes(t)) {
                      setSelectedTags((prev) => [...prev, t]);
                    }
                    setNewTag("");
                  }}
                  className="bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-4 rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* ── Financials ───────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4 mb-8">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <DollarSign
                className="text-primary-500"
                size={18}
                strokeWidth={2.5}
              />
              Financials
            </h3>

            <div className="relative group">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Purchase Cost / Lien Amount
              </label>
              <CurrencyInput
                value={price}
                onChange={(raw) => {
                  setPrice(raw);
                  if (touched) {
                    const n = raw !== "" ? parseFloat(raw) : undefined;
                    setErrors((prev) => ({
                      ...prev,
                      purchasePrice:
                        !n || n <= 0 ? "Must be greater than 0" : undefined,
                    }));
                  }
                }}
              />
              {errors.purchasePrice && (
                <span className="text-red-500 text-xs font-semibold block mt-2">
                  {errors.purchasePrice}
                </span>
              )}
            </div>
            <div className="pt-6 pb-20">
              <button
                type="button"
                onClick={handleSubmit}
                className="w-full bg-primary-500 hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-[15px] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <Smartphone size={20} />
                Save &amp; Add Device
              </button>
            </div>
          </div>

          {/* Optional Supplier Section */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4 mb-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Package
                  className="text-primary-500"
                  size={18}
                  strokeWidth={2.5}
                />
                Supplier (Optional)
              </h3>
              <button
                type="button"
                onClick={() => setShowSupplierSection(!showSupplierSection)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
              >
                {showSupplierSection ? "Hide" : "Add"}
              </button>
            </div>

            {showSupplierSection && (
              <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                {/* Supplier Picker */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                    Who are you buying from?
                  </label>
                  <CustomerPicker
                    selectedId={selectedSupplier?.id}
                    onSelect={(supplier) => setSelectedSupplier(supplier)}
                  />
                </div>

                {selectedSupplier && (
                  <>
                    {/* Acquisition Channel */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Acquisition Channel
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {(["DIRECT", "PLATFORM", "INTER_TENANT"] as const).map(
                          (channel) => (
                            <button
                              key={channel}
                              type="button"
                              onClick={() => setAcquisitionChannel(channel)}
                              className={clsx(
                                "px-3 py-2 rounded-xl text-sm font-bold border transition-all active:scale-[0.97]",
                                acquisitionChannel === channel
                                  ? "bg-primary-500 border-primary-500 text-white"
                                  : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                              )}
                            >
                              {channel}
                            </button>
                          ),
                        )}
                      </div>
                    </div>

                    {/* Platform Name (only for PLATFORM) */}
                    {acquisitionChannel === "PLATFORM" && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                          Platform Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Cashify, OLX, Budli"
                          value={platformName}
                          onChange={(e) => setPlatformName(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:border-primary-500 outline-none transition-colors"
                        />
                      </div>
                    )}

                    {/* Platform Fee (only for PLATFORM) */}
                    {acquisitionChannel === "PLATFORM" && (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                          Platform Fee (Optional)
                        </label>
                        <CurrencyInput
                          value={platformFeeStr}
                          onChange={setPlatformFeeStr}
                        />
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          This fee will be added to the cost basis
                        </p>
                      </div>
                    )}

                    {/* Payment Mode */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Payment Mode
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {(
                          ["CASH", "UPI", "BANK_TRANSFER", "CREDIT"] as const
                        ).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setPaymentMode(mode)}
                            className={clsx(
                              "px-3 py-2 rounded-xl text-sm font-bold border transition-all active:scale-[0.97]",
                              paymentMode === mode
                                ? mode === "CREDIT"
                                  ? "bg-amber-500 border-amber-500 text-white"
                                  : "bg-primary-500 border-primary-500 text-white"
                                : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                            )}
                          >
                            {mode.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Amount Paid */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                        Amount Paid to Supplier
                      </label>
                      <CurrencyInput
                        value={amountPaidStr}
                        onChange={setAmountPaidStr}
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Total: ₹{price || "0"}
                        {amountPaidStr &&
                          parseFloat(amountPaidStr) <
                            parseFloat(price || "0") && (
                            <span className="text-amber-600 dark:text-amber-400 ml-2">
                              Outstanding: ₹
                              {(
                                parseFloat(price || "0") -
                                parseFloat(amountPaidStr)
                              ).toLocaleString()}
                            </span>
                          )}
                      </p>
                    </div>

                    {/* Due Date */}
                    {(amountPaidStr &&
                      parseFloat(amountPaidStr) < parseFloat(price || "0")) ||
                    paymentMode === "CREDIT" ? (
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                          Payment Due By (Optional)
                        </label>
                        <input
                          type="date"
                          value={dueDateStr}
                          onChange={(e) => setDueDateStr(e.target.value)}
                          className="w-full h-12 px-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-800 text-sm font-semibold focus:border-primary-500 outline-none transition-colors"
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </div>
        </form>
      </main>

      <BatchAddSheet open={showBatchAdd} onOpenChange={setShowBatchAdd} />
    </div>
  );
}
