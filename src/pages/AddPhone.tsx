import React, { useState, useMemo, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { addPhone } from "../features/inventory/slice";
import { addEntry } from "../features/ledger/slice";
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
  getBrandOptions,
  getModelOptions,
  getRamOptions,
  getStorageOptions,
  getColorOptions,
  isCatalogBrand,
  isCatalogModel,
  sortBySize,
  type ColorOption,
} from "../lib/catalogHelpers";
import { CatalogAutocomplete } from "../components/ui/CatalogAutocomplete";
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
} from "lucide-react";

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

/** All brand names from the catalog — computed once. */
const CATALOG_BRANDS = getBrandOptions();

// ─── Component ────────────────────────────────────────────────────────────────

export default function AddPhone() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const masterData = useAppSelector((state) => state.masterData);

  // ── Form state (controlled, not RHF — gives us full sync control) ──
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [price, setPrice] = useState<string>("");

  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState(false);

  // ─── Derived options (memoized, catalog-only) ───────────────────────────────

  /** Brand list — catalog only, computed once */
  const brandOptions = useMemo<string[]>(() => CATALOG_BRANDS, []);

  /** Model list — only recomputed when brand changes */
  const modelOptions = useMemo<string[]>(() => getModelOptions(brand), [brand]);

  /** RAM options — recomputed only when brand+model change */
  const ramOptions = useMemo<string[]>(
    () => sortBySize(getRamOptions(brand, model)),
    [brand, model],
  );

  /** Storage options — recomputed only when brand+model change */
  const storageOptions = useMemo<string[]>(
    () => sortBySize(getStorageOptions(brand, model)),
    [brand, model],
  );

  /** Color options — recomputed only when brand+model change */
  const colorOptions = useMemo<ColorOption[]>(
    () => getColorOptions(brand, model),
    [brand, model],
  );

  // true only if the selected model is fully in the catalog (enables model-locked dropdowns)
  const modelInCatalog = useMemo(
    () => isCatalogModel(brand, model),
    [brand, model],
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

    navigate("/inventory");
    toast.success("Device Added", {
      description: `${brand} ${model} has been added to your pending inventory.`,
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
    setErrors({});
    setTouched(false);
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
            Add New Device
          </h2>
          <button
            type="button"
            onClick={handleReset}
            className="text-[#064a98] dark:text-blue-400 font-bold text-sm px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
          >
            Reset
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto p-4 overflow-y-auto z-10">
        <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Hint when model is locked to catalog */}
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
              {[...new Set([...masterData.issueTags, ...selectedTags])].map(
                (tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const isSevere =
                    tag.toLowerCase().includes("crack") ||
                    tag.toLowerCase().includes("dead") ||
                    tag.toLowerCase().includes("broken");
                  const isWarning =
                    tag.toLowerCase().includes("fail") ||
                    tag.toLowerCase().includes("battery") ||
                    tag.toLowerCase().includes("scratch");

                  let baseStyle =
                    "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:border-slate-300 dark:hover:border-slate-600";
                  if (isSelected) {
                    if (isSevere)
                      baseStyle =
                        "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-bold";
                    else if (isWarning)
                      baseStyle =
                        "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold";
                    else
                      baseStyle =
                        "bg-[#064a98]/10 dark:bg-blue-500/10 border-[#064a98]/30 dark:border-blue-500/30 text-[#064a98] dark:text-blue-400 font-bold";
                  }

                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
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
                },
              )}
            </div>

            <div className="pt-3 border-t border-slate-50 dark:border-slate-800 mt-2">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Custom Issue
              </label>
              <div className="flex gap-2 relative">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={handleAddCustomTag}
                  className="w-full flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#064a98]/20 dark:focus:ring-blue-500/20 outline-none pl-4 pr-16 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Type new issue…"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="absolute right-2 top-2 bottom-2 bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 dark:hover:bg-slate-200 text-white dark:text-slate-900 px-3 rounded-lg text-xs font-bold transition-colors"
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
                Purchase Cost / Lien Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xl">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    if (touched) {
                      const n =
                        e.target.value !== ""
                          ? parseFloat(e.target.value)
                          : undefined;
                      setErrors((prev) => ({
                        ...prev,
                        purchasePrice:
                          !n || n <= 0 ? "Must be greater than 0" : undefined,
                      }));
                    }
                  }}
                  className="w-full rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 pl-10 pr-4 py-4 text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 transition-all placeholder:font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none"
                  placeholder="0"
                />
              </div>
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
            Save &amp; Add Device
          </button>
        </div>
      </div>
    </div>
  );
}
