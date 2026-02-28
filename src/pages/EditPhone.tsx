import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { updatePhone } from "../features/inventory/slice";
import { addEntry } from "../features/ledger/slice";
import { useNavigate, useParams } from "react-router-dom";
import {
  addBrand,
  addModel,
  addColorOption,
  addIssueTag,
} from "../features/masterData/slice";
import clsx from "clsx";
import { toast } from "sonner";
import { Phone } from "../features/inventory/types";
import {
  ChevronLeft,
  Smartphone,
  Cpu,
  Wrench,
  DollarSign,
  Check,
  Plus,
  MonitorSmartphone,
  MemoryStick,
  Palette,
  Search,
} from "lucide-react";

const phoneSchema = z.object({
  brand: z.string().min(1, "Required"),
  model: z.string().min(1, "Required"),
  ram: z.string().optional().or(z.literal("")),
  storage: z.string().min(1, "Required"),
  color: z.string().min(1, "Required"),
  purchasePrice: z.number().min(1, "Required"),
});

type PhoneFormValues = z.infer<typeof phoneSchema>;

export default function EditPhone() {
  const { id } = useParams<{ id: string }>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const phone = useAppSelector((state) =>
    state.inventory.phones.find((p) => p.id === id),
  );

  const masterData = useAppSelector((state) => state.masterData);

  const [selectedTags, setSelectedTags] = useState<string[]>(
    phone ? phone.issueTags : [],
  );
  const [newTag, setNewTag] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormValues>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      brand: phone?.brand || "",
      model: phone?.model || "",
      ram: phone?.ram === "N/A" ? "" : phone?.ram || "",
      storage: phone?.storage || "",
      color: phone?.color || "",
      purchasePrice: phone?.purchasePrice || 0,
    },
  });

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

  const onSubmit = (data: PhoneFormValues) => {
    if (data.brand && !masterData.brands.includes(data.brand))
      dispatch(addBrand(data.brand));
    if (data.model && !masterData.models.includes(data.model))
      dispatch(addModel(data.model));
    if (data.color && !masterData.colorOptions.includes(data.color))
      dispatch(addColorOption(data.color));

    selectedTags.forEach((tag) => {
      if (!masterData.issueTags.includes(tag)) dispatch(addIssueTag(tag));
    });

    const updatedPhone: Phone = {
      ...phone,
      ...data,
      ram: data.ram || "N/A",
      issueTags: selectedTags,
    };

    dispatch(updatePhone(updatedPhone));

    // Handle price changes if phone is still pending
    if (
      phone.status === "PENDING" &&
      data.purchasePrice !== phone.purchasePrice
    ) {
      const priceDifference = data.purchasePrice - phone.purchasePrice;

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
      description: `Changes to ${data.brand} ${data.model} saved successfully.`,
    });
    navigate(`/inventory/${phone.id}`);
  };

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
      if (newTag.trim() !== "") {
        const t = newTag.trim();
        if (!selectedTags.includes(t)) {
          setSelectedTags([...selectedTags, t]);
        }
        setNewTag("");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-300 relative">
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

      <main className="flex-1 w-full max-w-lg mx-auto p-4 overflow-y-auto z-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Device Details */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone
                className="text-[#064a98]"
                size={18}
                strokeWidth={2.5}
              />
              Device Details
            </h3>

            <div className="space-y-4">
              <div className="relative group">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Brand
                </label>
                <div className="relative">
                  <input
                    list="brands"
                    {...register("brand")}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="Select or type Brand"
                  />
                  <MonitorSmartphone
                    className="absolute left-3.5 top-3.5 text-slate-400"
                    size={18}
                  />
                  <datalist id="brands">
                    {masterData.brands.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
                {errors.brand && (
                  <span className="text-red-500 text-xs font-semibold block mt-1">
                    {errors.brand.message}
                  </span>
                )}
              </div>

              <div className="relative group">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Model
                </label>
                <div className="relative">
                  <input
                    list="models"
                    {...register("model")}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. iPhone 14 Pro Max"
                  />
                  <Search
                    className="absolute left-3.5 top-3.5 text-slate-400"
                    size={18}
                  />
                  <datalist id="models">
                    {masterData.models.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                </div>
                {errors.model && (
                  <span className="text-red-500 text-xs font-semibold block mt-1">
                    {errors.model.message}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Specifications */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Cpu className="text-[#064a98]" size={18} strokeWidth={2.5} />
              Specifications
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="relative group">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  RAM (Optional)
                </label>
                <div className="relative">
                  <input
                    list="ram"
                    {...register("ram")}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. 8GB"
                  />
                  <MemoryStick
                    className="absolute left-3.5 top-3.5 text-slate-400"
                    size={18}
                  />
                  <datalist id="ram">
                    {masterData.ramOptions.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                </div>
              </div>

              <div className="relative group">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                  Storage
                </label>
                <div className="relative">
                  <input
                    list="storage"
                    {...register("storage")}
                    className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    placeholder="e.g. 256GB"
                  />
                  <MemoryStick
                    className="absolute left-3.5 top-3.5 text-slate-400"
                    size={18}
                  />
                  <datalist id="storage">
                    {masterData.storageOptions.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                {errors.storage && (
                  <span className="text-red-500 text-xs font-semibold block mt-1">
                    {errors.storage.message}
                  </span>
                )}
              </div>
            </div>

            <div className="relative group pt-1">
              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                Color
              </label>
              <div className="relative">
                <input
                  list="colors"
                  {...register("color")}
                  className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-10 pr-4 py-3.5 text-sm font-bold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="e.g. Midnight Green"
                />
                <Palette
                  className="absolute left-3.5 top-3.5 text-slate-400"
                  size={18}
                />
                <datalist id="colors">
                  {masterData.colorOptions.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              {errors.color && (
                <span className="text-red-500 text-xs font-semibold block mt-1">
                  {errors.color.message}
                </span>
              )}
            </div>
          </div>

          {/* Condition & Issues */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Wrench
                  className="text-[#064a98]"
                  size={18}
                  strokeWidth={2.5}
                />
                Condition & Issues
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
                  className="w-full flex-1 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-[#064a98] dark:focus:ring-blue-500 pl-4 pr-16 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  placeholder="Type new issue..."
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

          {/* Financials */}
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
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-xl">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  disabled={phone.status !== "PENDING"}
                  {...register("purchasePrice", { valueAsNumber: true })}
                  className={clsx(
                    "w-full rounded-xl border-2 pl-10 pr-4 py-4 text-2xl font-black tracking-tight transition-all outline-none",
                    phone.status === "PENDING"
                      ? "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-[#064a98] dark:focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      : "border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed",
                  )}
                  placeholder="0"
                />
              </div>
              {errors.purchasePrice && (
                <span className="text-red-500 text-xs font-semibold block mt-2">
                  {errors.purchasePrice.message}
                </span>
              )}
            </div>
          </div>
        </form>
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 p-4 pb-24 z-50">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit(onSubmit)}
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
