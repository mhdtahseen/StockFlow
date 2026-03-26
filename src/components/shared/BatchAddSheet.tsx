import React, { useState, useEffect, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/app/hooks";
import { addPurchaseOrder } from "@/features/purchasing/slice";
import { addEntry } from "@/features/ledger/slice";
import type {
  PurchaseOrder,
  AcquisitionChannel,
  PayMode,
} from "@/features/purchasing/types";
import { Customer } from "@/features/customers/types";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { CatalogAutocomplete } from "@/components/ui/CatalogAutocomplete";
import { useDeviceCatalog, sortBySize } from "@/hooks/useDeviceCatalog";
import { usePlan } from "@/hooks/usePlan";
import {
  Search,
  Plus,
  Trash2,
  Smartphone,
  TrendingDown,
  Info,
  Calculator,
} from "lucide-react";
import CurrencyInput from "@/components/ui/CurrencyInput";
import clsx from "clsx";
import { toast } from "sonner";

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
}

export function BatchAddSheet({ open, onOpenChange }: Props) {
  const dispatch = useAppDispatch();
  const { canUse } = usePlan();
  const {
    getBrandOptions,
    getModelOptions,
    getRamOptions,
    getStorageOptions,
    getColorOptions,
  } = useDeviceCatalog();

  const [supplier, setSupplier] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<AcquisitionChannel>("DIRECT");
  const [platformFeeStr, setPlatformFeeStr] = useState<string>("0");
  const [cashAmountStr, setCashAmountStr] = useState<string>("0");
  const [upiAmountStr, setUpiAmountStr] = useState<string>("0");
  const [bankAmountStr, setBankAmountStr] = useState<string>("0");
  const [selectedTab, setSelectedTab] = useState<"CASH" | "UPI" | "BANK_TRANSFER">("CASH");
  const [dueDateStr, setDueDateStr] = useState<string>("");

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
    },
  ]);
  const [bulkPriceStr, setBulkPriceStr] = useState("");

  useEffect(() => {
    if (open) {
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
        },
      ]);
      setBulkPriceStr("");
    }
  }, [open]);

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        brand: "",
        model: "",
        ram: "",
        storage: "",
        color: "",
        purchasePrice: "",
      },
    ]);
  };

  const removeRow = (id: string) => {
    if (rows.length > 1) {
      setRows((prev) => prev.filter((r) => r.id !== id));
    }
  };

  const updateRow = (id: string, updates: Partial<DeviceRow>) => {
    setRows((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r)),
    );
  };

  const applyBulkPrice = () => {
    const price = parseFloat(bulkPriceStr);
    if (isNaN(price) || price <= 0) return toast.error("Invalid Bulk Price");
    const perUnit = (price / rows.length).toFixed(2);
    setRows((prev) => prev.map((r) => ({ ...r, purchasePrice: perUnit })));
    toast.success("Distributed Cost", {
      description: `₹${perUnit} assigned to ${rows.length} units.`,
    });
  };

  const totalCost = useMemo(() => {
    return rows.reduce((sum, r) => sum + (parseFloat(r.purchasePrice) || 0), 0);
  }, [rows]);

  const platformFee = parseFloat(platformFeeStr) || 0;
  const totalAmount = totalCost + platformFee;

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
    if (!supplier) return toast.error("Please select a supplier");
    if (isCredit && !dueDateStr)
      return toast.error("Please provide a due date");
    if (!canUse("purchase_orders"))
      return toast.error("Purchase Orders require Pro plan");

    const orderId = crypto.randomUUID();
    const orderItems = rows.map((r) => ({
      id: r.id, // Keep the row ID for the items
      purchaseOrderId: orderId,
      phoneId: null, // Linked later during receipt
      status: "PENDING_INSPECTION" as const,
      purchasePrice: parseFloat(r.purchasePrice) || 0,
      // Pass snapshots of metadata if defined
      meta: {
        brand: r.brand,
        model: r.model,
        ram: r.ram,
        storage: r.storage,
        color: r.color,
      },
    }));

    const order: PurchaseOrder = {
      id: orderId,
      counterpartyId: supplier.id,
      acquisitionChannel: channel,
      totalAmount,
      platformFee,
      amountPaid,
      status: amountPaid >= totalAmount ? "SETTLED" : "AWAITING_RECEIPT",
      paymentMode: payMode,
      phonesOrdered: rows.length,
      phonesReceived: 0,
      // P3-BUG-24: Store raw date string — avoid .toISOString() which shifts timezone in IST+5:30
      dueDate: isCredit ? dueDateStr : undefined,
      createdAt: new Date().toISOString(),
      items: orderItems as any, // Extend if needed in types
    };

    dispatch(addPurchaseOrder(order));

    const paymentEntries = [
      { amount: cashPaid, mode: "CASH", note: "Cash" },
      { amount: upiPaid, mode: "UPI", note: "UPI" },
      { amount: bankPaid, mode: "BANK_TRANSFER", note: "Bank Transfer" },
    ].filter((p) => p.amount > 0);

    paymentEntries.forEach((p) => {
      dispatch(
        addEntry({
          id: crypto.randomUUID(),
          type: "FUNDS_PLEDGED",
          referenceId: orderId,
          amount: -p.amount,
          note: `Capital pledged (${p.note}) for PO-${orderId.slice(0, 6)}`,
          createdAt: new Date().toISOString(),
        }),
      );
    });

    onOpenChange(false);
    toast.success("Purchase Order Committed");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[95vh] flex flex-col p-0 rounded-t-[2.5rem] border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
      >
        <SheetHeader className="p-6 pb-4 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center">
            <div>
              <SheetTitle className="text-2xl font-black">
                Stock Up Manifest
              </SheetTitle>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                Batch Purchase Recorder
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-primary-500 dark:text-blue-400">
                MANIFEST VALUE
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
                  1. Vendor Source
                </label>
                <CustomerPicker
                  selectedId={supplier?.id}
                  onSelect={setSupplier}
                />
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
                    Itemized Units
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {rows.length} devices defined
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="relative w-40">
                    <CurrencyInput
                      placeholder="Bulk Total"
                      value={bulkPriceStr}
                      onChange={setBulkPriceStr}
                      className="h-9 text-sm! font-bold rounded-xl border-transparent focus:border-primary-500 pl-10! py-0! "
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={applyBulkPrice}
                    className="h-9 px-3 text-[10px] font-black uppercase tracking-tight rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                  >
                    Distribute
                  </Button>
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
                          Phone Spec
                        </span>
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
                          label="Brand"
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
                          label="Model"
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
                            options={sortBySize(getRamOptions(row.brand, row.model))}
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
                          className="h-12 text-sm! font-black py-0! rounded-xl !pl-10"
                          placeholder="0.00"
                        />
                      </div>
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
                  Define Extra Model Item
                </Button>
              </div>
            </section>

            {/* FEES & PAYMENT SECTION */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">
                  3. Transaction Details
                </label>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Platform/Logistics Fee
                      </span>
                      <span className="text-xs text-slate-400">
                        Added to total capital
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

              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 bg-primary-500 h-full" />
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-4 block">
                  4. Capital Layout
                </label>
                <div className="space-y-6">
                  {/* Mode Tabs */}
                  <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    {(["CASH", "UPI", "BANK_TRANSFER"] as const).map((mode) => {
                       const val = mode === "CASH" ? cashPaid : mode === "UPI" ? upiPaid : bankPaid;
                       return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setSelectedTab(mode)}
                          className={clsx(
                            "flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all relative flex flex-col items-center gap-1",
                            selectedTab === mode
                              ? "bg-white dark:bg-slate-800 text-primary-500 shadow-sm border border-slate-100 dark:border-slate-700"
                              : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
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
                        <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-tighter">Initial Payment Sum</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                           ₹{amountPaid.toLocaleString()}
                        </span>
                     </div>
                     {amountPaid < totalAmount && (
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-rose-400 uppercase block tracking-tighter text-right">Remaining Balance</span>
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
                            Pending Balance: ₹{(totalAmount - amountPaid).toLocaleString()}
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
                              className="h-12 font-black border-2 border-amber-100 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 rounded-xl"
                            />
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-400 italic font-medium">
                        * A due date is required safely capture credit/partial payments.
                      </p>
                    </div>
                  )}
                  
                  {amountPaid === totalAmount && (
                     <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/40 flex items-center gap-3">
                        <div className="size-8 bg-emerald-500 rounded-full flex items-center justify-center text-white">
                           <Info size={16} />
                        </div>
                        <p className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-tight">
                           Full Payment Reconciled - No Debt
                        </p>
                     </div>
                  )}
                </div>
              </div>
            </section>
          </form>
        </div>

        <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="size-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-primary-500">
              <Smartphone size={24} />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-tight">
                Purchase Manifest
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
            Drop Ledger Entry
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
