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
  Smartphone,
  TrendingDown,
  Info,
  Calculator,
  LayoutGrid,
  Receipt,
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
          const { rows: savedRows, bulkPriceStr: savedBulk, supplier: savedSup, channel: savedChan } = JSON.parse(saved);
          // Migrate old drafts that had 'imei' string instead of 'imeis' array
          const migratedRows = savedRows.map((r: any) => ({
            ...r,
            imeis: r.imeis || (r.imei ? [{ value: r.imei, status: 'UNVERIFIED' }] : [{ value: '', status: 'UNVERIFIED' }])
          }));
          setRows(migratedRows);
          setBulkPriceStr(savedBulk);
          if (savedSup) setSupplier(savedSup);
          if (savedChan) setChannel(savedChan);
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
      const draft = { rows, bulkPriceStr, supplier, channel };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }
  }, [rows, bulkPriceStr, supplier, channel, open]);

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
      notes: channel === "PLATFORM" ? `Source: ${selectedPlatform}` : undefined,
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
        className="h-[95vh] flex flex-col p-0 rounded-t-[2.5rem] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      >
        <SheetHeader className="px-6 pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl font-black">
                Purchase Order
              </SheetTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Add to Stock
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-primary-500 dark:text-blue-400">
                TOTAL VALUE
              </span>
              <p className="text-xl font-black text-slate-900 dark:text-slate-100 italic">
                ₹{totalAmount.toLocaleString()}
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
                  1. {channel === "DIRECT" ? "Supplier" : "Platform"}
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
                  2. Channel
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
                    3. Fees
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

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">
                  {channel === "PLATFORM" ? "4. Payment" : "3. Payment"}
                </label>
                <div className="space-y-6">
                  {/* Mode Tabs */}
                  <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {(["CASH", "UPI", "BANK_TRANSFER"] as const).map((mode) => {
                      const val =
                        mode === "CASH"
                          ? cashPaid
                          : mode === "UPI"
                            ? upiPaid
                            : bankPaid;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedTab(mode)}
                          className={clsx(
                            "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all relative flex flex-col items-center gap-1",
                            selectedTab === mode
                              ? "bg-white dark:bg-slate-800 text-primary-500 shadow-sm border border-slate-100 dark:border-slate-700"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200",
                          )}
                        >
                          {mode.replace("_", " ")}
                          {val > 0 && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-primary-500 text-white rounded-full leading-none">
                              ₹{val.toLocaleString()}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Single Visible Input */}
                  <div className="animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight ml-1 mb-2 block">
                      Record {selectedTab.replace("_", " ")} Amount
                    </label>
                    {selectedTab === "CASH" && (
                      <CurrencyInput
                        value={cashAmountStr}
                        onChange={setCashAmountStr}
                        className="h-16 text-2xl! py-0! rounded-2xl"
                      />
                    )}
                    {selectedTab === "UPI" && (
                      <CurrencyInput
                        value={upiAmountStr}
                        onChange={setUpiAmountStr}
                        className="h-16 text-2xl! py-0! rounded-2xl"
                      />
                    )}
                    {selectedTab === "BANK_TRANSFER" && (
                      <CurrencyInput
                        value={bankAmountStr}
                        onChange={setBankAmountStr}
                        className="h-16 text-2xl! py-0! rounded-2xl"
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter">
                          Amount Paid
                      </span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        ₹{amountPaid.toLocaleString()}
                      </span>
                    </div>
                    {amountPaid < totalAmount && (
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-rose-400 uppercase block tracking-tighter text-right">
                          Remaining Balance
                        </span>
                        <span className="text-sm font-black text-rose-500 italic">
                          ₹{(totalAmount - amountPaid).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {amountPaid < totalAmount && (
                    <div className="animate-in fade-in slide-in-from-top-2 border-t border-slate-100 dark:border-slate-800 pt-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div>
                          <label className="text-sm font-black text-rose-500 block mb-1">
                            Pending Balance: ₹
                            {(totalAmount - amountPaid).toLocaleString()}
                          </label>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                            Credit Settlement Layout
                          </p>
                        </div>
                        <div className="flex-1 max-w-xs">
                          <Input
                            required
                            type="date"
                            value={dueDateStr}
                            onChange={(e) => setDueDateStr(e.target.value)}
                            className="h-12 font-black border-2 border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl uppercase [color-scheme:light] dark:[color-scheme:dark]"
                          />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-medium">
                        * A due date is required for credit or partial payments.
                      </p>
                    </div>
                  )}

                  {amountPaid === totalAmount && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
                      <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                        <Info size={16} />
                      </div>
                      <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                        Fully Paid — No Balance Due
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="px-6 pt-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500">
              <Smartphone size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-tight">
                Order Total
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 italic">
                ₹{totalAmount.toLocaleString()}{" "}
                <span className="text-sm font-medium text-slate-400 not-italic">
                  ({rows.length} Units)
                </span>
              </span>
            </div>
          </div>

          <Button
            type="submit"
            form="batch-po-form"
            className="w-full sm:w-auto px-10 h-16 rounded-2xl text-lg font-black tracking-wide bg-primary-500 hover:bg-blue-800 text-white shadow-xl shadow-primary-500/20 transition-all active:scale-[0.98]"
          >
            Confirm Order
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
