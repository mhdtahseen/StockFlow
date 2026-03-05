import React, { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { updatePhone } from "../features/inventory/slice";
import { addEntry } from "../features/ledger/slice";
import { useNavigate, useParams } from "react-router-dom";
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
} from "lucide-react";

// ─── Validation ──────────────────────────────────────────────────────────────

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

// ─── Static (computed once) ──────────────────────────────────────────────────

// ─── Component ────────────────────────────────────────────────────────────────

export default function EditPhone() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const phone = useAppSelector((state) =>
    state.inventory.phones.find((p) => p.id === id),
  );
  const masterData = useAppSelector((state) => state.masterData);

  // ── Early returns for guarded states ───────────────────────────────────────
  if (!phone) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Device not found
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#064a98] font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (phone.status === "SOLD") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Cannot edit a sold device.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-[#064a98] font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  return <EditPhoneForm phone={phone} />;
}

// ─── Inner form component (hooks are safe here after early returns) ──────────

function EditPhoneForm({ phone }: { phone: Phone }) {
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

  const [brand, setBrand] = useState(phone.brand);
  const [model, setModel] = useState(phone.model);
  const [ram, setRam] = useState(phone.ram === "N/A" ? "" : phone.ram);
  const [storage, setStorage] = useState(phone.storage);
  const [color, setColor] = useState(phone.color);
  const [price, setPrice] = useState<string>(String(phone.purchasePrice));

  const [selectedTags, setSelectedTags] = useState<string[]>(phone.issueTags);
  const [newTag, setNewTag] = useState("");
  const [isIssuesExpanded, setIsIssuesExpanded] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // ── IMEI state (populated from Supabase) ───────────
  const [imeis, setImeis] = useState<ImeiEntry[]>(
    phone.imeis && phone.imeis.length > 0
      ? phone.imeis.map((i) => ({ value: i, status: "UNVERIFIED" }))
      : [{ value: "", status: "UNVERIFIED" }],
  );

  // ─── Derived options (memoized, catalog-only) ──────────────────────────────

  const brandOptions = useMemo<string[]>(
    () => getBrandOptions(),
    [getBrandOptions],
  );

  const modelOptions = useMemo<string[]>(
    () => getModelOptions(brand),
    [brand, getModelOptions],
  );

  const ramOptions = useMemo<string[]>(
    () => sortBySize(getRamOptions(brand, model)),
    [brand, model, getRamOptions],
  );

  const storageOptions = useMemo<string[]>(
    () => sortBySize(getStorageOptions(brand, model)),
    [brand, model, getStorageOptions],
  );

  const colorOptions = useMemo<ColorOption[]>(
    () => getColorOptions(brand, model),
    [brand, model, getColorOptions],
  );

  const modelInCatalog = useMemo(
    () => isCatalogModel(brand, model),
    [brand, model, isCatalogModel],
  );

  // ─── Cascading resets ─────────────────────────────────────────────────────

  const handleBrandChange = useCallback((newBrand: string) => {
    setBrand(newBrand);
    setModel("");
    setRam("");
    setStorage("");
    setColor("");
  }, []);

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

    // Block save if any filled IMEI is invalid
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

    // Persist custom values to masterData
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

    const updatedPhone: Phone = {
      ...phone,
      brand,
      model,
      ram: ram || "N/A",
      storage,
      color,
      imeis: filledImeis.map((e) => e.value).slice(0, 2),
      purchasePrice: parseFloat(price),
      issueTags: selectedTags,
    };

    dispatch(updatePhone(updatedPhone));

    // Handle price changes if phone is still pending
    if (
      phone.status === "PENDING" &&
      parseFloat(price) !== phone.purchasePrice
    ) {
      const priceDifference = parseFloat(price) - phone.purchasePrice;

      if (priceDifference > 0) {
        dispatch(
          addEntry({
            id: crypto.randomUUID(),
            type: "FUNDS_PLEDGED",
            referenceId: phone.id,
            amount: priceDifference,
            createdAt: new Date().toISOString(),
          }),
        );
      } else if (priceDifference < 0) {
        dispatch(
          addEntry({
            id: crypto.randomUUID(),
            type: "FUNDS_RELEASED",
            referenceId: phone.id,
            amount: Math.abs(priceDifference),
            createdAt: new Date().toISOString(),
          }),
        );
      }
    }

    toast.success("Device Updated", {
      description: `Changes to ${brand} ${model} saved successfully.`,
    });
    navigate(`/inventory/${phone.id}`);
  };

  // ─── Re-validate on change when form has been submitted once ──────────────

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

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300 relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="size-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
          >
            <ChevronLeft size={24} strokeWidth={2.5} />
          </button>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex-1">
            Edit Device
          </h2>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-slate-500 dark:text-slate-400 font-bold text-sm px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-4 pb-32 overflow-y-auto z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── IMEI ────────────────────────────────────────────────────── */}
          <ImeiSection imeis={imeis} onChange={setImeis} />

          {/* ── Device Details ───────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone
                className="text-[#064a98]"
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

            {modelInCatalog && (
              <p className="text-[10px] font-semibold text-[#064a98]/70 dark:text-blue-400/70 flex items-center gap-1 -mt-2">
                <Check size={11} strokeWidth={3} />
                Catalog model — storage & colors auto-loaded
              </p>
            )}
          </div>

          {/* ── Specifications ───────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="text-[#064a98]" size={18} strokeWidth={2.5} />
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

            {/* Color preview swatch */}
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
                  className="text-[#064a98]"
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
                className="text-[#064a98]"
                size={18}
                strokeWidth={2.5}
              />
              Financials
            </h3>

            <div className="relative group">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Purchase Cost {phone.status !== "PENDING" && "(Locked)"}
              </label>
              <CurrencyInput
                value={price}
                disabled={phone.status !== "PENDING"}
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
          </div>
        </form>
      </main>

      {/* Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 pb-24 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            className="w-full bg-[#064a98] hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-[15px] shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <Smartphone size={20} />
            Update Device
          </button>
        </div>
      </div>
    </div>
  );
}
