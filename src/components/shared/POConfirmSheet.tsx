import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { confirmReceipt } from "@/features/purchasing/slice";
import { addPhone } from "@/features/inventory/slice";
import { PurchaseOrder, POItemStatus } from "@/features/purchasing/types";
import { Phone } from "@/features/inventory/types";
import { CatalogAutocomplete } from "@/components/ui/CatalogAutocomplete";
import { useDeviceCatalog, sortBySize } from "@/hooks/useDeviceCatalog";
import CurrencyInput from "@/components/ui/CurrencyInput";
import ImeiSection from "@/components/ImeiSection";
import { type ImeiEntry, validateImei } from "@/utils/validateImei";
import { issuesFlatList } from "@/data/issueCatalog";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Smartphone,
  Zap,
  Info,
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  Undo2,
  Fingerprint,
  Wrench,
  MonitorSmartphone,
  Palette,
  HardDrive,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: PurchaseOrder;
}

type RejectionReason = "SCRATCHED" | "DEAD" | "WRONG_MODEL" | "OTHER";

export function POConfirmSheet({ open, onOpenChange, order }: Props) {
  const dispatch = useAppDispatch();
  const inventoryPhones = useAppSelector((state) => state.inventory.phones);
  const {
    getBrandOptions,
    getModelOptions,
    getRamOptions,
    getStorageOptions,
    getColorOptions,
  } = useDeviceCatalog();

  const pendingItems = order.items.filter(
    (i) => i.status === "PENDING_INSPECTION",
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  // ─── Inspection State ──────────────────────────────────────────────────────
  const [imeis, setImeis] = useState<ImeiEntry[]>([
    { value: "", status: "UNVERIFIED" },
  ]);
  const [brand, setBrand] = useState("Apple");
  const [model, setModel] = useState("");
  const [ram, setRam] = useState("");
  const [storage, setStorage] = useState("");
  const [color, setColor] = useState("");
  const [purchasePriceStr, setPurchasePriceStr] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] =
    useState<RejectionReason>("OTHER");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [processed, setProcessed] = useState<
    Record<
      string,
      {
        status: POItemStatus;
        phoneId: string | null;
        reason?: string;
        price?: number;
        brandSnapshot?: string;
        modelSnapshot?: string;
        storageSnapshot?: string;
        colorSnapshot?: string;
        ramSnapshot?: string;
      }
    >
  >({});

  // ─── Popular Tags Logic ────────────────────────────────────────────────────
  const topIssues = useMemo(() => {
    const tagCounts: Record<string, number> = {};
    inventoryPhones.forEach((p) => {
      p.issueTags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    const sortedTags = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([tag]) => tag);

    const fallback = ["Minor Scratches", "Battery Service", "Mint Condition", "Display Replaced"];
    return [...new Set([...sortedTags, ...fallback])].slice(0, 5);
  }, [inventoryPhones]);

  useEffect(() => {
    if (open && pendingItems.length > 0) {
      setCurrentIndex(0);
      setProcessed({});
      resetForm(0);
    }
  }, [open, order.id]);

  const resetForm = (idx: number) => {
    if (idx < pendingItems.length) {
      const item = pendingItems[idx];
      setImeis([{ value: "", status: "UNVERIFIED" }]);
      setBrand(item.brandSnapshot || "Apple");
      setModel(item.modelSnapshot || "");
      setRam(item.ramSnapshot || "");
      setStorage(item.storageSnapshot || "");
      setColor(item.colorSnapshot || "");
      setPurchasePriceStr(item.purchasePrice.toString());
      setSelectedTags([]);
      setShowRejectionForm(false);
      setRejectionReason("OTHER");
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  if (pendingItems.length === 0) return null;
  const currentItem = pendingItems[currentIndex];

  if (currentIndex >= pendingItems.length) {
    const handleFinalSubmit = async () => {
      if (isSubmitting) return;
      setIsSubmitting(true);

      const newItems = order.items.map((it) => {
        if (processed[it.id]) {
          return {
            ...it,
            status: processed[it.id].status,
            phoneId: processed[it.id].phoneId,
            rejectionReason: processed[it.id].reason,
            purchasePrice: processed[it.id].price || it.purchasePrice,
            brandSnapshot: processed[it.id].brandSnapshot || it.brandSnapshot,
            modelSnapshot: processed[it.id].modelSnapshot || it.modelSnapshot,
            storageSnapshot: processed[it.id].storageSnapshot || it.storageSnapshot,
            colorSnapshot: processed[it.id].colorSnapshot || it.colorSnapshot,
            ramSnapshot: processed[it.id].ramSnapshot || it.ramSnapshot,
          };
        }
        return it;
      });

      const anyPending = newItems.some((i) => i.status === "PENDING_INSPECTION");
      const approvedCount = Object.values(processed).filter(
        (p) => p.status === "ACCEPTED",
      ).length;

      // Calculate final PO total based on accepted units only
      const newTotalAmount = newItems
        .filter((item) => item.status === "ACCEPTED")
        .reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

      try {
        // Dispatch to background sync manager immediately
        // This makes the UI feel instant and solves the Android "stalling" issue
        dispatch(
          confirmReceipt({
            id: order.id,
            items: newItems,
            status: anyPending ? "PARTIAL" : "RECEIVED",
            phonesReceived: (order.phonesReceived || 0) + approvedCount,
            totalAmount: newTotalAmount,
          }),
        );

        toast.success("Manifest Committing", {
          description: `Processing ${Object.keys(processed).length} units. Sync will complete in background.`,
        });
        
        // Give a tiny delay for the feedback before closing
        setTimeout(() => {
          onOpenChange(false);
          setIsSubmitting(false);
        }, 300);
      } catch (err: any) {
        setIsSubmitting(false);
        console.error("Failed to queue manifest commit:", err);
        toast.error("Process Failed", {
          description: "Something went wrong locally. Please try again.",
        });
      }
    };

    const summary = {
      accepted: Object.values(processed).filter((p) => p.status === "ACCEPTED")
        .length,
      rejected: Object.values(processed).filter((p) => p.status === "REJECTED")
        .length,
    };

    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85vh] flex flex-col p-0 rounded-t-[2.5rem] border-t-0 bg-white dark:bg-slate-950 overflow-hidden"
        >
          <div className="h-2 w-12 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto mt-3 shrink-0" />
          
          <div className="flex-1 flex flex-col items-center p-8 text-center overflow-y-auto pb-32">
            <div className="w-20 h-20 bg-primary-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                <PackageCheck className="text-primary-500" size={40} />
            </div>
            
            <SheetHeader className="mb-8 p-0">
              <SheetTitle className="text-3xl font-black tracking-tight mb-2">
                Inspection Summary
              </SheetTitle>
              <p className="text-slate-500 font-semibold px-4">
                Manifest for PO #{order.id.slice(0, 8).toUpperCase()} has been fully verified.
              </p>
            </SheetHeader>

            <div className="w-full max-w-sm grid grid-cols-2 gap-4 mb-10">
              <div className="bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 p-6 rounded-[2rem] flex flex-col items-center shadow-sm">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                </div>
                <div className="text-3xl font-black text-emerald-700 dark:text-emerald-400">
                  {summary.accepted}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-emerald-600/60 mt-1">
                  Accepted
                </div>
              </div>
              
              <div className="bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-800/50 p-6 rounded-[2rem] flex flex-col items-center shadow-sm">
                <div className="w-10 h-10 bg-rose-500/10 rounded-full flex items-center justify-center mb-3">
                  <XCircle className="text-rose-500" size={20} />
                </div>
                <div className="text-3xl font-black text-rose-700 dark:text-rose-400">
                  {summary.rejected}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-rose-600/60 mt-1">
                  Returned
                </div>
              </div>
            </div>

            <Button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="w-full max-w-sm h-16 rounded-2xl text-lg font-black tracking-wide bg-slate-900 hover:bg-black dark:bg-primary-500 dark:hover:bg-primary-600 text-white shadow-2xl shadow-slate-900/10 dark:shadow-primary-500/10 transition-all active:scale-[0.97] flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <>
                  Processing...
                  <Loader2 className="animate-spin" size={20} />
                </>
              ) : (
                <>
                  Commit Results
                  <ArrowRight size={20} strokeWidth={3} />
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  const handleAccept = () => {
    const filledImeis = imeis.filter(i => i.value.length > 0);
    if (filledImeis.length === 0) return toast.error("IMEI Required");
    
    if (!brand || !model || !storage || !color) {
      return toast.error("Specs Required", {
        description: "Please identify this unit before accepting.",
      });
    }

    const price = parseFloat(purchasePriceStr) || currentItem.purchasePrice;
    const phoneId = crypto.randomUUID();

    const phone: Phone = {
      id: phoneId,
      brand,
      model,
      storage,
      ram,
      color,
      purchasePrice: price,
      salePrice: Math.round(price * 1.15),
      status: "IN_STOCK",
      issueTags: selectedTags,
      imeis: filledImeis.map(i => i.value),
      createdAt: new Date().toISOString(),
      purchaseOrderId: order.id,
    };

    dispatch(addPhone(phone));
    setProcessed((prev) => ({
      ...prev,
      [currentItem.id]: { 
        status: "ACCEPTED", 
        phoneId, 
        price,
        brandSnapshot: brand,
        modelSnapshot: model,
        storageSnapshot: storage,
        colorSnapshot: color,
        ramSnapshot: ram,
      },
    }));
    advance();
  };

  const handleReject = () => {
    if (!showRejectionForm) {
      setShowRejectionForm(true);
      return;
    }

    setProcessed((prev) => ({
      ...prev,
      [currentItem.id]: {
        status: "REJECTED",
        phoneId: null,
        reason: rejectionReason,
        price: 0,
        brandSnapshot: brand,
        modelSnapshot: model,
        storageSnapshot: storage,
        colorSnapshot: color,
        ramSnapshot: ram,
      },
    }));
    advance();
  };

  const advance = () => {
    const nextIdx = currentIndex + 1;
    setCurrentIndex(nextIdx);
    resetForm(nextIdx);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] flex flex-col p-0 rounded-t-[2.5rem] border-t-0 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      >
        {/* Progress Bar Top */}
        <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 shrink-0">
          <div 
            className="h-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${((currentIndex) / pendingItems.length) * 100}%` }}
          />
        </div>

        <SheetHeader className="p-6 pb-5 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shadow-sm relative z-20">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck size={20} className="text-primary-500" strokeWidth={3} />
                <SheetTitle className="text-2xl font-black tracking-tight">Inspection</SheetTitle>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black bg-primary-500/10 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                  Unit {currentIndex + 1} of {pendingItems.length}
                </span>
              </div>
            </div>
            
            <div className="bg-slate-900 dark:bg-white px-4 py-2.5 rounded-2xl border border-slate-900 dark:border-white shadow-xl shadow-slate-900/10 dark:shadow-white/5 text-right flex flex-col items-end">
              <label className="text-[8px] font-black text-slate-400 dark:text-slate-500 block mb-0.5 uppercase tracking-widest leading-none">Manifest Quote</label>
              <p className="text-lg font-black text-white dark:text-slate-900 tracking-tighter leading-none">
                ₹{currentItem.purchasePrice.toLocaleString()}
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-6 space-y-8 pb-44 custom-scrollbar">
          
          {/* Main Inspection Card — Exactly matching CreateOrderSheet secondary container style */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-[2rem] border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
            
            {/* 1. IDENTITY HEADER */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="size-8 bg-slate-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-xl flex items-center justify-center text-xs font-black shrink-0">
                  {currentIndex + 1}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-tight leading-none mb-1">Device Audit</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{currentIndex + 1} of {pendingItems.length} items</p>
                </div>
              </div>
              <Fingerprint size={16} className="text-primary-500" />
            </div>

            <div className="p-5 space-y-6">
              {/* IMEI SECTION — Premium Styled */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm">
                <ImeiSection 
                  imeis={imeis} 
                  onChange={setImeis} 
                  showVerificationSection={false} 
                />
              </div>

              {/* AUTOCOMPLETE GRID — Matching CreateOrderSheet Field Grid */}
              <div className="grid grid-cols-2 gap-4">
                <CatalogAutocomplete
                  label="Brand"
                  options={getBrandOptions()}
                  value={brand}
                  onChange={(v) => { setBrand(v); setModel(''); setStorage(''); setColor(''); }}
                  placeholder="Apple"
                  icon={<MonitorSmartphone size={17} />}
                />
                <CatalogAutocomplete
                  label="Model"
                  options={getModelOptions(brand)}
                  value={model}
                  onChange={(v) => { setModel(v); setStorage(''); setColor(''); }}
                  placeholder={brand ? "Model" : "..."}
                  icon={<Search size={17} />}
                  disabled={!brand}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CatalogAutocomplete
                  label="Storage" 
                  options={sortBySize(getStorageOptions(brand, model))} 
                  value={storage} 
                  onChange={setStorage}
                  placeholder="..." 
                  icon={<HardDrive size={17} />} 
                  disabled={!model}
                />
                <CatalogAutocomplete
                  label="RAM"
                  options={sortBySize(getRamOptions(brand, model))}
                  value={ram}
                  onChange={setRam}
                  placeholder="..."
                  icon={<Fingerprint size={17} />}
                  disabled={!model}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                <CatalogAutocomplete
                  label="Color" 
                  options={getColorOptions(brand, model)} 
                  value={color} 
                  onChange={setColor}
                  placeholder="..." 
                  icon={<Palette size={17} />} 
                  disabled={!model}
                />
              </div>
            </div>

            {/* ISSUES SECTION — Integrated Footer Style */}
            <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-700 bg-white/30 dark:bg-slate-900/30">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Condition Tags</label>
              <div className="flex flex-wrap gap-2">
                  {topIssues.map(tag => (
                    <button
                      key={tag} 
                      type="button" 
                      onClick={() => toggleTag(tag)}
                      className={clsx(
                        "px-3 py-2 rounded-xl text-[10px] font-bold tracking-tight transition-all border",
                        selectedTags.includes(tag) 
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg active:scale-95" 
                          : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700"
                      )}
                    >
                      {tag}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          {/* PRICING OVERRIDE — Distinct Action Card */}
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] overflow-hidden">
             <div className="px-5 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pricing Strategy</span>
                <Zap size={14} className="text-primary-500" />
             </div>
             
             <div className="p-5">
                <div className="relative">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 block ml-1">Actual Purchase Price</label>
                  <CurrencyInput value={purchasePriceStr} onChange={setPurchasePriceStr} />
                </div>
             </div>
          </div>

          {/* REJECTION PANEL */}
          {showRejectionForm && (
            <div className="bg-rose-600 p-8 rounded-[2.5rem] border-0 text-white shadow-2xl shadow-rose-600/30 animate-in slide-in-from-bottom-8 duration-500 flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="size-16 bg-white/10 rounded-[1.5rem] flex items-center justify-center backdrop-blur-md">
                    <AlertTriangle size={32} className="text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight leading-none mb-1">Return Item?</h3>
                  <p className="text-sm font-bold text-white/70">Select disqualification reason</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(["SCRATCHED", "DEAD", "WRONG_MODEL", "OTHER"] as RejectionReason[]).map(
                  (r) => (
                    <button
                      key={r}
                      onClick={() => setRejectionReason(r)}
                      className={clsx(
                        "py-5 rounded-3xl text-[10px] font-black tracking-widest uppercase transition-all backdrop-blur-md border-2",
                        rejectionReason === r
                          ? "bg-white text-rose-600 border-white shadow-lg"
                          : "bg-white/5 border-white/20 text-white/90 hover:bg-white/10"
                      )}
                    >
                      {r.replace("_", " ")}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => setShowRejectionForm(false)}
                className="w-full h-14 bg-white/10 rounded-2xl text-xs font-black uppercase tracking-widest text-white/80 hover:bg-white/20"
              >
                Cancel Return
              </button>
            </div>
          )}
        </div>

        {/* FLOATING ACTION FOOTER */}
        <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border-t border-slate-100 dark:border-slate-800 z-50">
          <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto">
            <Button
              variant="outline"
              onClick={handleReject}
              className={clsx(
                "h-16 rounded-[1.5rem] text-sm font-black tracking-wider uppercase transition-all border-2 flex flex-col items-center justify-center leading-none gap-1",
                showRejectionForm
                  ? "bg-rose-600 border-rose-600 text-white hover:bg-rose-700 shadow-xl shadow-rose-600/20"
                  : "text-rose-600 border-rose-100 hover:bg-rose-50 dark:hover:bg-rose-950/30"
              )}
            >
              {showRejectionForm ? (
                <>
                  <Undo2 size={18} strokeWidth={3} />
                  <span>Confirm Return</span>
                </>
              ) : (
                <>
                  <XCircle size={18} strokeWidth={3} />
                  <span>Mark Faulty</span>
                </>
              )}
            </Button>
            
            <Button
              onClick={handleAccept}
              disabled={showRejectionForm}
              className="h-16 rounded-[1.5rem] bg-slate-900 hover:bg-black dark:bg-primary-500 dark:hover:bg-primary-600 text-white text-sm font-black tracking-wider uppercase shadow-2xl shadow-slate-900/10 dark:shadow-primary-500/10 active:scale-95 transition-all flex flex-col items-center justify-center leading-none gap-1 disabled:bg-slate-100 disabled:text-slate-400"
            >
              <CheckCircle2 size={18} strokeWidth={3} />
              <span>Verify & Add</span>
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
