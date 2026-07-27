import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { CatalogAutocomplete } from "@/components/ui/CatalogAutocomplete";
import { useDeviceCatalog, sortBySize } from "@/hooks/useDeviceCatalog";
import { usePlan } from "@/hooks/usePlan";
import { useUpgradeGate } from "@/context/UpgradeGateContext";
import { Button } from "@/components/ui/button";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { addPurchaseOrder } from "@/features/purchasing/slice";
import { useAuth } from "@/context/AuthContext";
import type {
  PurchaseOrder,
  AcquisitionChannel,
  PayMode,
} from "@/features/purchasing/types";
import { Customer } from "@/features/customers/types";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import ImeiSection from "../ImeiSection";
import type { ImeiEntry } from "@/utils/validateImei";
import {
  Search,
  Plus,
  Trash2,
  TrendingDown,
  LayoutGrid,
  Receipt,
  DollarSign,
  Check,
} from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";
import clsx from "clsx";
import { toast } from "sonner";
import {
  determineGstType,
  calculateGst,
  calculateOrderGst,
  isValidGstin,
  DEFAULT_GST_RATE,
} from "@/utils/gstCalc";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Building } from "lucide-react";
import Autocomplete from "../ui/Autocomplete";
import { PLATFORM_CATALOG } from "@/data/platforms";
import { lookupUnitByImei } from "@/app/supabaseApi";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DeviceRow {
  id: string;
  brand: string;
  model: string;
  ram: string;
  storage: string;
  color: string;
  purchasePrice: string;
  imeis: ImeiEntry[];
  isAutoPopulated?: boolean;
}

export function BulkDeviceEntrySheet({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();
  const { user, tenant } = useAuth();
  const { canUse } = usePlan();
  const { showUpgrade } = useUpgradeGate();
  const customers = useAppSelector((state) => state.customers.customers);
  const {
    getBrandOptions,
    getModelOptions,
    getRamOptions,
    getStorageOptions,
    getColorOptions,
  } = useDeviceCatalog();

  const [supplier, setSupplier] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<AcquisitionChannel>("DIRECT");
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const [platformFeeStr, setPlatformFeeStr] = useState<string>("0");
  const [cashAmountStr, setCashAmountStr] = useState<string>("0");
  const [upiAmountStr, setUpiAmountStr] = useState<string>("0");
  const [bankAmountStr, setBankAmountStr] = useState<string>("0");
  const [selectedTab, setSelectedTab] = useState<
    "CASH" | "UPI" | "BANK_TRANSFER"
  >("CASH");
  const [dueDateStr, setDueDateStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  // ── GST (purchase input tax) ───────────────────────────────────────────────────────
  const [gstEnabled, setGstEnabled] = useState(false);
  const [gstInclusive, setGstInclusive] = useState(true);
  const [sellerGstin, setSellerGstin] = useState("");

  // Sync GSTIN from supplier profile whenever supplier changes
  useEffect(() => {
    setSellerGstin(supplier?.gstin || "");
  }, [supplier?.id]);

  // Multi-row State
  const [rows, setRows] = useState<DeviceRow[]>([
    {
      id: crypto.randomUUID(),
      brand: "",
      model: "",
      ram: "",
      storage: "",
      color: "",
      purchasePrice: "",
      imeis: [{ value: "", status: "UNVERIFIED" }],
    },
  ]);
  const [bulkPriceStr, setBulkPriceStr] = useState("");


  // Draft Persistence logic
  const DRAFT_KEY = `sf_draft_po_${user?.id}`;

  // Load draft on open
  useEffect(() => {
    if (open) {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        try {
          const { rows: savedRows, bulkPriceStr: savedBulk, supplier: savedSup, channel: savedChan, notes: savedNotes } = JSON.parse(saved);
          // Migrate old drafts that had 'imei' string instead of 'imeis' array
          const migratedRows = savedRows.map((r: any) => ({
            ...r,
            imeis: r.imeis || (r.imei ? [{ value: r.imei, status: 'UNVERIFIED' }] : [{ value: '', status: 'UNVERIFIED' }])
          }));
          setRows(migratedRows);
          setBulkPriceStr(savedBulk);
          if (savedSup) setSupplier(savedSup);
          if (savedChan) setChannel(savedChan);
          if (savedNotes) setNotes(savedNotes);
        } catch (e) {
          console.error("Failed to load draft", e);
        }
      } else {
        // Default clear
        setSupplier(null);
        setChannel("DIRECT");
        setPlatformFeeStr("0");
        setCashAmountStr("");
        setUpiAmountStr("0");
        setBankAmountStr("0");
        setSelectedTab("CASH");
        setDueDateStr("");
        setNotes("");
        setRows([
          {
            id: crypto.randomUUID(),
            brand: "",
            model: "",
            ram: "",
            storage: "",
            color: "",
            purchasePrice: "",
            imeis: [{ value: "", status: "UNVERIFIED" }],
          },
        ]);
        setBulkPriceStr("");
      }
    }
  }, [open, user?.id]);

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY);
  }, [DRAFT_KEY]);

  // Save draft on change
  useEffect(() => {
    if (open && rows.length > 0) {
      const draft = { rows, bulkPriceStr, supplier, channel, notes };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [rows, bulkPriceStr, supplier, channel, notes, open]);

  const updateRow = (id: string, updates: Partial<DeviceRow>) => {
    setRows((prev) => {
      const rowIndex = prev.findIndex((r) => r.id === id);
      if (rowIndex === -1) return prev;

      const next = [...prev];
      next[rowIndex] = { ...next[rowIndex], ...updates };

      // IMEI Duplicate Check & Registry Lookup (Phase 10)
      if (updates.imeis !== undefined) {
        updates.imeis.forEach((imeiEntry) => {
          if (imeiEntry.value.length > 0) {
            const isDuplicate = prev.some(
              (r) =>
                r.id !== id && r.imeis.some((ei) => ei.value === imeiEntry.value),
            );
            if (isDuplicate) {
              toast.error(`Duplicate IMEI detected: ${imeiEntry.value}`, {
                id: `dup-imei-${id}-${imeiEntry.value}`,
                duration: 3000,
              });
            }
          }
        });

        // Registry Lookup (Phase 10) - Check any IMEI entry for 15-digit length
        const anyValidImei = updates.imeis.find((i) => i.value.length === 15)?.value;
        if (anyValidImei) {
          lookupUnitByImei(anyValidImei).then((registryData) => {
            if (registryData) {
              setRows((current) =>
                current.map((r) =>
                  r.id === id
                    ? {
                        ...r,
                        brand: registryData.brand || r.brand,
                        model: registryData.model || r.model,
                        ram: registryData.ram || r.ram,
                        storage: registryData.storage || r.storage,
                        color: registryData.color || r.color,
                        isAutoPopulated: true,
                      }
                    : r,
                ),
              );
              toast.success("Device specs auto-filled from registry", {
                icon: <Sparkles className="size-4 text-amber-500" />,
                id: `registry-hit-${id}`,
              });
            }
          });
        }
      }

      // If we updated a price
      if (updates.purchasePrice !== undefined) {
        const target = parseFloat(bulkPriceStr) || 0;
        const lastIndex = next.length - 1;

        // Logic: If user edits any row EXCEPT the last, and we have a target total,
        // we balance the LAST row to keep the target total consistent.
        if (target > 0 && rowIndex < lastIndex && next.length > 1) {
          const othersSum = next
            .slice(0, lastIndex)
            .reduce((sum, r) => sum + (parseFloat(r.purchasePrice) || 0), 0);

          // If the sum of others already exceeds target, we cap residual at 0
          // and let the total expand
          const residual = Math.max(0, target - othersSum);
          next[lastIndex] = {
            ...next[lastIndex],
            purchasePrice: residual > 0 ? residual.toString() : "",
          };

          // If manual inputs exceeded target, update the target to the true sum
          const totalNow = othersSum + residual;
          if (totalNow !== target) {
            setBulkPriceStr(totalNow === 0 ? "" : totalNow.toString());
          }
        } else {
          // Otherwise (editing last row OR no target set), we update the target total to the new sum
          const newTotalCost = next.reduce(
            (sum, r) => sum + (parseFloat(r.purchasePrice) || 0),
            0,
          );
          setBulkPriceStr(newTotalCost === 0 ? "" : newTotalCost.toString());
        }
      }

      return next;
    });
  };

  const handleBulkPriceChange = (val: string) => {
    setBulkPriceStr(val);
    const target = parseFloat(val) || 0;

    if (rows.length > 0) {
      setRows((prev) => {
        const next = [...prev];
        const lastIndex = next.length - 1;
        const othersSum = next
          .slice(0, lastIndex)
          .reduce((sum, r) => sum + (parseFloat(r.purchasePrice) || 0), 0);

        const residual = Math.max(0, target - othersSum);
        next[lastIndex] = {
          ...next[lastIndex],
          purchasePrice: residual > 0 ? residual.toString() : "",
        };
        return next;
      });
    }
  };

  const addRow = () => {
    // Multi-device ingestion requires bulk_orders (Pro+)
    if (!canUse("bulk_orders")) {
      showUpgrade("bulk_orders");
      return;
    }
    setRows((prev) => {
      const next = [
        ...prev,
        {
          id: crypto.randomUUID(),
          brand: "",
          model: "",
          ram: "",
          storage: "",
          color: "",
          purchasePrice: "",
          imeis: [{ value: "", status: "UNVERIFIED" as const }],
        },
      ];
      // When adding a row, we just update the total sum (the new row starts at 0)
      const newTotalCost = next.reduce(
        (sum, r) => sum + (parseFloat(r.purchasePrice) || 0),
        0,
      );
      setBulkPriceStr(newTotalCost === 0 ? "" : newTotalCost.toString());
      return next;
    });
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows((prev) => {
        const next = prev.filter((r) => r.id !== id);
        const newTotalCost = next.reduce(
          (sum, r) => sum + (parseFloat(r.purchasePrice) || 0),
          0,
        );
        setBulkPriceStr(newTotalCost === 0 ? "" : newTotalCost.toString());
        return next;
      });
    }
  };

  // Legacy scan handlers removed - handled by ImeiSection

  const applyEqualDistribution = () => {
    const price = parseFloat(bulkPriceStr);
    if (isNaN(price) || price <= 0)
      return toast.error("Enter a bulk price first");
    const perUnit = (price / rows.length).toFixed(2);
    setRows((prev) => prev.map((r) => ({ ...r, purchasePrice: perUnit })));
    toast.success("Equal Distribution Applied", {
      description: `₹${perUnit} assigned to each of the ${rows.length} units.`,
    });
  };

  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.purchasePrice) || 0), 0);
  }, [rows]);

  const platformFee = channel === "PLATFORM" ? (parseFloat(platformFeeStr) || 0) : 0;

  const gstType = useMemo(
    () => determineGstType(sellerGstin || supplier?.gstin, tenant?.gstin),
    [sellerGstin, supplier?.gstin, tenant?.gstin],
  );
  const gstBreakdown = useMemo(() => {
    if (!gstEnabled || rows.length === 0) return null;
    const prices = rows.map((r) => parseFloat(r.purchasePrice) || 0).filter(Boolean);
    if (prices.length === 0) return null;
    return calculateOrderGst(prices, DEFAULT_GST_RATE, gstType, gstInclusive);
  }, [gstEnabled, rows, gstType, gstInclusive]);

  const totalAmount = useMemo(() => {
    const cost = gstEnabled && gstBreakdown ? gstBreakdown.grandTotal : totalCost;
    return cost + platformFee;
  }, [gstEnabled, gstBreakdown, totalCost, platformFee]);

  const cashPaid = parseFloat(cashAmountStr) || 0;
  const upiPaid = parseFloat(upiAmountStr) || 0;
  const bankPaid = parseFloat(bankAmountStr) || 0;
  const amountPaid = cashPaid + upiPaid + bankPaid;

  const isCredit = amountPaid < totalAmount;
  const payMode: PayMode =
    [cashPaid, upiPaid, bankPaid].filter((a) => a > 0).length > 1
      ? "SPLIT"
      : cashPaid > 0
        ? "CASH"
        : upiPaid > 0
          ? "UPI"
          : bankPaid > 0
            ? "BANK_TRANSFER"
            : "CREDIT";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Determine effective counterparty
    let effectiveSupplier = supplier;
    if (channel === "PLATFORM") {
      // Find the 'Platforms' generic customer if exists
      effectiveSupplier = customers.find(c =>
        c.name.toLowerCase().includes("platform")
      ) || null;
      
      if (!effectiveSupplier && customers.length > 0) {
        effectiveSupplier = customers[0];
      }
    }

    if (!effectiveSupplier) return toast.error(channel === "PLATFORM" ? "Please create a customer named 'Platforms' first" : "Please select a supplier");
    if (channel === "PLATFORM" && !selectedPlatform) {
      return toast.error("Please select a platform (Cashify, OLX, etc.)");
    }

    if (isCredit && !dueDateStr)
      return toast.error("Please provide a due date");

    const orderId = crypto.randomUUID();
    const orderItems = rows.map((r) => ({
      id: r.id, // Keep the row ID for the items
      purchaseOrderId: orderId,
      phoneId: null, // Linked later during receipt
      status: "PENDING_INSPECTION" as const,
      purchasePrice: parseFloat(r.purchasePrice) || 0,
      brand: r.brand,
      model: r.model,
      ram: r.ram,
      storage: r.storage,
      color: r.color,
      imei: r.imeis.filter(i => i.value.length > 0).map(i => i.value).join(" / "),
      ...(gstEnabled ? (() => {
        const ig = calculateGst(parseFloat(r.purchasePrice) || 0, DEFAULT_GST_RATE, gstType, gstInclusive);
        return { hsnCode: "8517", gstRate: DEFAULT_GST_RATE, taxableValue: ig.taxableValue, cgstAmount: ig.cgstAmount, sgstAmount: ig.sgstAmount, igstAmount: ig.igstAmount };
      })() : {}),
    }));

    const order: PurchaseOrder = {
      id: orderId,
      counterpartyId: effectiveSupplier.id,
      acquisitionChannel: channel,
      platformName: channel === "PLATFORM" ? selectedPlatform : undefined,
      totalAmount,
      platformFee,
      amountPaid,
      status: amountPaid >= totalAmount ? "SETTLED" : "AWAITING_RECEIPT",
      paymentMode: payMode,
      phonesOrdered: rows.length,
      phonesReceived: 0,
      // P3-BUG-24: Store raw date string — avoid .toISOString() which shifts timezone in IST+5:30
      dueDate: isCredit ? dueDateStr : undefined,
      notes: [
        channel === "PLATFORM" ? `Source: ${selectedPlatform}` : null,
        notes.trim() || null,
      ].filter(Boolean).join(" · ") || undefined,
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
            sellerGstin: sellerGstin.trim().toUpperCase() || supplier?.gstin || undefined,
          }
        : {}),
      items: orderItems as any,
    };

    // Dispatch PO to Redux + sync outbox.
    // The create_purchase_order RPC handles the SUPPLIER_PAYMENT ledger entry server-side.
    // The addPurchaseOrder extraReducer in ledger/slice creates a virtual pendingEntry for optimistic display.
    dispatch(addPurchaseOrder(order));
    clearDraft();
    onOpenChange(false);
    toast.success("Purchase Order Committed");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92dvh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      >
        <SheetHeader className="px-4 py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 mt-2">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <TrendingDown size={18} className="text-primary-500" strokeWidth={2.5} />
            </div>
            <div>
              <SheetTitle className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                Purchase Order
              </SheetTitle>
              <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Add devices to stock
              </p>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto w-full p-4 sm:p-6 pb-32">
          <form
            id="batch-po-form"
            onSubmit={handleSubmit}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* SUPPLIER SECTION */}
            <section className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">
                  {channel === "DIRECT" ? "Supplier" : "Platform"}
                </label>
                {channel === "DIRECT" ? (
                  <CustomerPicker
                    selectedId={supplier?.id}
                    onSelect={(v) => { setSupplier(v); setSellerGstin(v.gstin || ""); }}
                  />
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
              <div className="w-full sm:w-64">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-3 block">
                  Channel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["DIRECT", "PLATFORM"].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setChannel(c as AcquisitionChannel)}
                      className={clsx(
                        "py-2.5 rounded-xl text-[10px] font-black tracking-wide border transition-all",
                        channel === c
                          ? "bg-primary-500 text-white border-primary-500 shadow-lg shadow-blue-900/20"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-400 border-slate-200 dark:border-slate-800",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* BATCH ROWS SECTION */}
            <section className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Items
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {rows.length} device{rows.length !== 1 ? "s" : ""}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex items-center bg-white dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group focus-within:border-primary-500 transition-all">
                    <div className="flex-1">
                      <CurrencyInput
                        placeholder="Total Value"
                        value={bulkPriceStr}
                        onChange={handleBulkPriceChange}
                        className="h-10 text-sm! font-black border-transparent bg-transparent pl-11! py-0! focus:ring-0"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={applyEqualDistribution}
                      className="h-10 px-4 flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary-500 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all border-l border-slate-100 dark:border-slate-800 uppercase tracking-[0.15em]"
                    >
                      <LayoutGrid size={12} />
                      Distribute
                    </button>
                  </div>
                  <div className="flex items-center gap-2 pl-2">
                    <span className="flex-shrink-0 w-1 h-1 rounded-full bg-primary-500 animate-pulse" />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      Last item fills the remaining amount
                    </p>
                  </div>
                </div>
              </div>


              <div className="divide-y divide-slate-50 dark:divide-slate-800">
                {rows.map((row, index) => (
                  <div
                    key={row.id}
                    className="p-6 bg-white dark:bg-slate-900 animate-in fade-in slide-in-from-right-2 duration-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="size-6 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg flex items-center justify-center text-[10px] font-black">
                          {index + 1}
                        </span>
                        <span className="text-xs font-black text-slate-500 uppercase tracking-tight">
                          Device
                        </span>
                        {row.isAutoPopulated && (
                          <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/50 flex items-center gap-1 py-0.5 px-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-in zoom-in-50 duration-500">
                            <Sparkles size={10} />
                            Registry Match
                          </Badge>
                        )}
                      </div>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                      <div className="sm:col-span-3">
                        <CatalogAutocomplete
                          label={
                            <div className="flex items-center gap-1.5">
                              Brand
                              {row.isAutoPopulated && (
                                <Sparkles size={10} className="text-amber-500 animate-pulse" />
                              )}
                            </div>
                          }
                          value={row.brand}
                          onChange={(v) =>
                            updateRow(row.id, {
                              brand: v,
                              model: "",
                              ram: "",
                              storage: "",
                              color: "",
                            })
                          }
                          options={getBrandOptions()}
                        />
                      </div>
                      <div className="sm:col-span-3">
                        <CatalogAutocomplete
                          label={
                            <div className="flex items-center gap-1.5">
                              Model
                              {row.isAutoPopulated && (
                                <Sparkles size={10} className="text-amber-500 animate-pulse" />
                              )}
                            </div>
                          }
                          value={row.model}
                          onChange={(v) =>
                            updateRow(row.id, {
                              model: v,
                              ram: "",
                              storage: "",
                              color: "",
                            })
                          }
                          options={getModelOptions(row.brand)}
                          placeholder="Model..."
                          disabled={!row.brand}
                        />
                      </div>
                      <div className="sm:col-span-4 space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          <CatalogAutocomplete
                            label="RAM"
                            value={row.ram}
                            onChange={(v) => updateRow(row.id, { ram: v })}
                            options={sortBySize(
                              getRamOptions(row.brand, row.model),
                            )}
                            disabled={!row.model}
                            placeholder="RAM"
                          />
                          <CatalogAutocomplete
                            label="Storage"
                            value={row.storage}
                            onChange={(v) => updateRow(row.id, { storage: v })}
                            options={sortBySize(
                              getStorageOptions(row.brand, row.model),
                            )}
                            disabled={!row.model}
                            placeholder="Storage"
                          />
                        </div>
                        <CatalogAutocomplete
                          label="Color"
                          value={row.color}
                          onChange={(v) => updateRow(row.id, { color: v })}
                          options={getColorOptions(row.brand, row.model)}
                          disabled={!row.model}
                          placeholder="Color"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-extrabold uppercase tracking-wide text-slate-500 block mb-2">
                          Cost (₹)
                        </label>
                        <CurrencyInput
                          value={row.purchasePrice}
                          onChange={(v) =>
                            updateRow(row.id, { purchasePrice: v })
                          }
                          className="h-12 text-sm! font-black py-0! rounded-xl pl-10!"
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    {/* IMEI & SCANNER SECTION */}
                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                      <ImeiSection
                        imeis={row.imeis}
                        onChange={(vals) => updateRow(row.id, { imeis: vals })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={addRow}
                  className="group text-primary-500 dark:text-blue-400 font-black text-xs uppercase tracking-widest gap-2 py-6 w-full rounded-2xl hover:bg-white dark:hover:bg-slate-900 transition-all"
                >
                  <Plus
                    size={18}
                    className="group-hover:scale-125 transition-transform"
                  />
                  Add Item
                </Button>
              </div>
            </section>

            {/* ─── GST Section (optional) ─────────────────────────────────── */}
            {tenant?.gstin && (
              <section className="mb-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Receipt size={16} className="text-emerald-600" strokeWidth={2.5} />
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
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
                        gstEnabled ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700",
                      )}
                    >
                      <span className={clsx("inline-block h-4 w-4 rounded-full bg-white shadow transition-transform", gstEnabled ? "translate-x-6" : "translate-x-1")} />
                    </button>
                  </div>

                  {gstEnabled && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-5 py-4 space-y-3">
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
              </section>
            )}

            {/* FEES & PAYMENT SECTION */}
            <section className={clsx(
              "grid gap-6 transition-all duration-300",
              channel === "PLATFORM" ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"
            )}>
              {channel === "PLATFORM" && (
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">
                    Fees
                  </label>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          Platform / Logistics Fee
                        </span>
                        <span className="text-xs text-slate-400">
                          Included in order total
                        </span>
                      </div>
                      <CurrencyInput
                        value={platformFeeStr}
                        onChange={setPlatformFeeStr}
                        className="h-12 text-base! py-0! rounded-xl font-bold"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                {/* Section header — mirrors SO Fiscal Settlement */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} className="text-primary-500" strokeWidth={2.5} />
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">Fiscal Settlement</span>
                  </div>
                  <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Payment channel tabs */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                      Payment Channel
                    </label>
                    <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                      {(["CASH", "UPI", "BANK_TRANSFER"] as const).map((mode) => {
                        const val = mode === "CASH" ? cashPaid : mode === "UPI" ? upiPaid : bankPaid;
                        return (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setSelectedTab(mode)}
                            className={clsx(
                              "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all relative",
                              selectedTab === mode
                                ? "bg-white dark:bg-slate-800 text-primary-500 shadow-sm"
                                : "text-slate-400 hover:text-slate-600",
                            )}
                          >
                            {mode.replace("_", " ")}
                            {val > 0 && (
                              <span className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active channel input */}
                  <div className="animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      {selectedTab.replace("_", " ")} Amount
                    </label>
                    {selectedTab === "CASH" && (
                      <CurrencyInput size="md" value={cashAmountStr} onChange={setCashAmountStr} placeholder="0" />
                    )}
                    {selectedTab === "UPI" && (
                      <CurrencyInput size="md" value={upiAmountStr} onChange={setUpiAmountStr} placeholder="0" />
                    )}
                    {selectedTab === "BANK_TRANSFER" && (
                      <CurrencyInput size="md" value={bankAmountStr} onChange={setBankAmountStr} placeholder="0" />
                    )}
                  </div>

                  {/* Channel breakdown badges */}
                  {amountPaid > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {cashPaid > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800/40 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                          <Check size={10} strokeWidth={3} />
                          Cash ₹{cashPaid.toLocaleString("en-IN")}
                        </span>
                      )}
                      {upiPaid > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-800/40 text-[10px] font-bold text-blue-700 dark:text-blue-400">
                          <Check size={10} strokeWidth={3} />
                          UPI ₹{upiPaid.toLocaleString("en-IN")}
                        </span>
                      )}
                      {bankPaid > 0 && (
                        <span className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-100 dark:border-violet-800/40 text-[10px] font-bold text-violet-700 dark:text-violet-400">
                          <Check size={10} strokeWidth={3} />
                          Bank ₹{bankPaid.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      Remarks / Notes
                    </label>
                    <input
                      type="text"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Supplier invoice no., purchase remarks…"
                      className="w-full h-11 px-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all"
                    />
                  </div>

                  {/* Summary row */}
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Amount Paid</span>
                      <span className="text-slate-700 dark:text-slate-300 font-bold">₹{amountPaid.toLocaleString("en-IN")}</span>
                    </div>
                    {amountPaid < totalAmount && (
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-amber-600 dark:text-amber-400">Outstanding</span>
                        <span className="text-amber-600 dark:text-amber-400 font-bold">₹{(totalAmount - amountPaid).toLocaleString("en-IN")}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-black border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1.5">
                      <span className="text-slate-900 dark:text-slate-100">Grand Total</span>
                      <span className="text-slate-900 dark:text-slate-100">₹{totalAmount.toLocaleString("en-IN")}</span>
                    </div>
                  </div>

                  {/* Credit due date — amber banner when outstanding */}
                  {amountPaid < totalAmount && (
                    <div className="animate-in slide-in-from-top-2 duration-200 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Credit Settlement — Due Date Required
                      </p>
                      <Input
                        required
                        type="date"
                        value={dueDateStr}
                        onChange={(e) => setDueDateStr(e.target.value)}
                        className="h-11 font-semibold border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:border-amber-500 rounded-xl uppercase [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button
            type="submit"
            form="batch-po-form"
            className="w-full py-4 h-14 rounded-2xl text-base font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2.5"
          >
            <TrendingDown size={20} strokeWidth={2.5} />
            Commit Purchase Ledger
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
