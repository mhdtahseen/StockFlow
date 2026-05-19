import React, { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  X,
  Plus,
  Percent,
  Tag,
  ShoppingCart,
  DollarSign,
  Check,
  Smartphone,
  Sparkles,
  Receipt,
} from "lucide-react";
import { useAppDispatch } from "@/app/hooks";
import { addOrder, updateOrder } from "@/features/billing/slice";
import {
  markAsSold,
  linkPhoneToSO,
  addPhone,
} from "@/features/inventory/slice";
import { addEntry } from "@/features/ledger/slice";
import { SaleOrder, OrderType, PayMode } from "@/features/billing/types";
import { Phone } from "@/features/inventory/types";
import { Customer } from "@/features/customers/types";
import { selectCustomers, selectCounterpartyAdvance } from "@/features/customers/selectors";
import { addCustomerSettlement } from "@/features/customers/slice";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { PhoneSelectorSheet } from "./PhoneSelectorSheet";
import { usePlan } from "@/hooks/usePlan";
import { useAuth } from "@/context/AuthContext";
import { useUpgradeGate } from "@/context/UpgradeGateContext";
import { useNavigate } from "react-router-dom";
import clsx from "clsx";
import { toast } from "sonner";
import { useAppSelector } from "@/app/hooks";
import { createTransfer } from "@/app/supabaseApi";
import {
  determineGstType,
  calculateOrderGst,
  DEFAULT_GST_RATE,
  DEFAULT_HSN_CODE,
  calculateGst,
  isValidGstin,
} from "@/utils/gstCalc";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialPhones?: Phone[];
  existingOrder?: SaleOrder;
}

interface OrderItemDraft {
  phone: Phone;
  salePrice: string;
  discountAmount: string;
  discountType: "FIXED" | "PERCENT";
}

// Hybrid payment channels (mirrors AddPhoneUpdate pattern)
type PayChannel = "CASH" | "UPI" | "BANK_TRANSFER";

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateOrderSheet({
  open,
  onOpenChange,
  initialPhones = [],
  existingOrder,
}: Props) {
  const isEditMode = !!existingOrder;
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orderType, setOrderType] = useState<OrderType>("RETAIL");
  const [items, setItems] = useState<OrderItemDraft[]>([]);
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [selectorOpen, setSelectorOpen] = useState(false);

  // ── GST state ──────────────────────────────────────────────────────────────
  const [gstEnabled, setGstEnabled] = useState(false);
  const [buyerGstin, setBuyerGstin] = useState("");

  // ── Hybrid payment state (same pattern as AddPhoneUpdate) ─────────────────
  const [activePayTab, setActivePayTab] = useState<PayChannel>("CASH");
  const [cashStr, setCashStr] = useState("");
  const [upiStr, setUpiStr] = useState("");
  const [bankStr, setBankStr] = useState("");
  const [dueDateStr, setDueDateStr] = useState("");
  const [notes, setNotes] = useState("");

  const { canUse, isExpired } = usePlan();
  const { showUpgrade } = useUpgradeGate();
  const { user, tenant } = useAuth();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const ledgerEntries = useAppSelector((state) => state.ledger.entries);
  const allCustomers = useAppSelector(selectCustomers);
  const { arAdvance } = useAppSelector(
    selectCounterpartyAdvance(customer?.id ?? ""),
  );

  // Auto-switch to TRANSFER when a linked counterparty is selected
  const handleCustomerSelect = (c: Customer) => {
    setCustomer(c);
    if (c.linkedTenantId && canUse("trade_network")) {
      setOrderType("TRANSFER");
    } else if (orderType === "TRANSFER" && !c.linkedTenantId) {
      setOrderType("RETAIL"); // reset if switching to a non-linked customer
    }
  };

  // ── Reset when sheet opens ─────────────────────────────────────────────────
  const prevOpen = React.useRef(open);

  React.useEffect(() => {
    // Only reset if transitioning from closed to open
    if (open && !prevOpen.current) {
      if (isEditMode && existingOrder) {
        // Pre-fill from existing order
        const existingCustomer = allCustomers.find((c) => c.id === existingOrder.counterpartyId) || null;
        setCustomer(existingCustomer);
        setOrderType((existingOrder as any).orderType || "RETAIL");
        setNotes(existingOrder.notes || "");
        setDueDateStr(existingOrder.dueDate || "");
        setItems([]);
      } else {
        setItems(
          initialPhones.map((p) => ({
            phone: p,
            salePrice: p.salePrice ? String(p.salePrice) : "",
            discountAmount: "",
            discountType: "FIXED",
          })),
        );
        setCustomer(null);
        setOrderType("RETAIL");
        setActivePayTab("CASH");
        setCashStr("");
        setUpiStr("");
        setBankStr("");
        setDueDateStr("");
        setNotes("");
        setShowDiscounts(false);
        setGstEnabled(false);
        setBuyerGstin("");
      }
    }
    prevOpen.current = open;
  }, [open, isEditMode, existingOrder, allCustomers, initialPhones]);

  // ── Derived amounts ────────────────────────────────────────────────────────
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = parseFloat(item.salePrice) || 0;
      const discountVal = parseFloat(item.discountAmount) || 0;
      const discount =
        item.discountType === "PERCENT"
          ? price * (discountVal / 100)
          : discountVal;
      return sum + Math.max(0, price - discount);
    }, 0);
  }, [items]);

  // ── GST breakdown (computed only when gstEnabled) ──────────────────────────
  const gstType = useMemo(
    () => determineGstType(tenant?.gstin, buyerGstin || customer?.gstin),
    [tenant?.gstin, buyerGstin, customer?.gstin],
  );

  const gstBreakdown = useMemo(() => {
    if (!gstEnabled || items.length === 0) return null;
    const effectivePrices = items.map((item) => {
      const price = parseFloat(item.salePrice) || 0;
      const discountVal = parseFloat(item.discountAmount) || 0;
      const discount =
        item.discountType === "PERCENT" ? price * (discountVal / 100) : discountVal;
      return Math.max(0, price - discount);
    });
    return calculateOrderGst(effectivePrices, DEFAULT_GST_RATE, gstType, true);
  }, [gstEnabled, items, gstType]);

  const cashPaid = parseFloat(cashStr) || 0;
  const upiPaid = parseFloat(upiStr) || 0;
  const bankPaid = parseFloat(bankStr) || 0;
  const totalPaid = cashPaid + upiPaid + bankPaid;
  // Advance that can be auto-applied against new order total
  const appliedAdvance = Math.min(arAdvance, totalAmount);
  const outstanding = Math.max(0, totalAmount - totalPaid - appliedAdvance);
  // Credit due date is required automatically when there's an outstanding balance
  const requiresDueDate = outstanding > 0;

  // Determine dominant payment mode for the TO record
  // (The TO only stores one paymentMode; individual channel amounts go to ledger)
  const dominantPayMode: PayMode = (() => {
    if (totalPaid === 0) return "CREDIT";
    const amounts = { CASH: cashPaid, UPI: upiPaid, BANK_TRANSFER: bankPaid };
    return Object.entries(amounts).sort((a, b) => b[1] - a[1])[0][0] as PayMode;
  })();

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return toast.error("Please select a customer");

    // ── Edit mode — only update mutable fields, no new financial entries ──
    if (isEditMode && existingOrder) {
      dispatch(
        updateOrder({
          id: existingOrder.id,
          counterpartyId: customer.id,
          notes: notes || undefined,
          dueDate: dueDateStr || undefined,
        }),
      );
      toast.success("Order updated");
      onOpenChange(false);
      return;
    }

    if (items.length === 0)
      return toast.error("Please add at least one device");
    if (requiresDueDate && !dueDateStr)
      return toast.error("A due date is required for the outstanding balance");
    if (requiresDueDate && dueDateStr) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (new Date(dueDateStr) <= today)
        return toast.error("Credit due date must be a future date (after today)");
    }

    const orderId = crypto.randomUUID();
    const ts = new Date().toISOString();

    // Apply any existing advance credit against the new order total
    const effectivePaid = Math.min(totalPaid + appliedAdvance, totalAmount);

    const paymentNote = undefined;

    const order: SaleOrder = {
      id: orderId,
      counterpartyId: customer.id,
      orderType,
      totalAmount,
      amountPaid: effectivePaid,
      status:
        effectivePaid >= totalAmount
          ? "SETTLED"
          : effectivePaid > 0
            ? "PARTIAL"
            : "OPEN",
      // Store dominant mode for the TO record
      paymentMode: dominantPayMode,
      dueDate: requiresDueDate ? dueDateStr : undefined,
      notes: notes || undefined,
      paymentNote, // Pass the generated note
      createdAt: ts,
      // ── GST fields ──────────────────────────────────────────────────────
      ...(gstEnabled && gstBreakdown
        ? {
            gstEnabled: true,
            gstType,
            gstRate: DEFAULT_GST_RATE,
            subtotal: gstBreakdown.subtotal,
            cgstAmount: gstBreakdown.cgstTotal,
            sgstAmount: gstBreakdown.sgstTotal,
            igstAmount: gstBreakdown.igstTotal,
            buyerGstin: buyerGstin.trim().toUpperCase() || customer.gstin || undefined,
          }
        : {}),
      items: items.map((draft) => {
        const price = parseFloat(draft.salePrice) || 0;
        const discountVal = parseFloat(draft.discountAmount) || 0;
        const discountAmt =
          draft.discountType === "PERCENT"
            ? price * (discountVal / 100)
            : discountVal;
        const effectivePrice = Math.max(0, price - discountAmt);
        const itemGst = gstEnabled
          ? calculateGst(effectivePrice, DEFAULT_GST_RATE, gstType, true)
          : null;

        return {
          id: crypto.randomUUID(),
          saleOrderId: orderId,
          phoneId: draft.phone.id,
          salePrice: price,
          discountAmount: discountAmt,
          effectivePrice,
          imeiSnapshot: draft.phone.imeis || [],
          brandSnapshot: draft.phone.brand,
          modelSnapshot: draft.phone.model,
          storageSnapshot: draft.phone.storage,
          colorSnapshot: draft.phone.color,
          ...(itemGst
            ? {
                hsnCode: DEFAULT_HSN_CODE,
                gstRate: DEFAULT_GST_RATE,
                taxableValue: itemGst.taxableValue,
                cgstAmount: itemGst.cgstAmount,
                sgstAmount: itemGst.sgstAmount,
                igstAmount: itemGst.igstAmount,
              }
            : {}),
        };
      }),
    };

    // ── FK-safe dispatch order (mirrors AddPhoneUpdate) ────────────────────
    // 1. Mark phones as sold (updates existing DB records — no FK issue)
    order.items.forEach(
      (item) =>
        item.phoneId &&
        dispatch(
          markAsSold({ id: item.phoneId, salePrice: item.effectivePrice }),
        ),
    );

    // 2. Create the trade order (sale_order_items reference phone IDs that now exist)
    dispatch(addOrder(order));

    // 3. If this is a TRANSFER, create mirror PO on receiver's tenant
    if (orderType === "TRANSFER" && customer.linkedTenantId) {
      createTransfer(orderId).catch((err) => {
        console.error("Transfer sync failed:", err);
        toast.error("Order created but transfer sync failed — contact support");
      });
    }

    // 3. Link phones to the SO (both sides now exist in DB)
    order.items.forEach(
      (item) =>
        item.phoneId &&
        dispatch(
          linkPhoneToSO({ phoneId: item.phoneId, saleOrderId: order.id }),
        ),
    );

    // Log ACTUAL Receipt (Cash Flow)
    // We no longer log "Bill Revenue" (accrual) to the ledger to maintain a Cash Basis Ledger.
    if (totalPaid > 0) {
      dispatch(
        addEntry({
          id: crypto.randomUUID(),
          type: "CUSTOMER_PAYMENT",
          referenceId: orderId,
          saleOrderId: orderId,
          paymentMode: dominantPayMode,
          amount: totalPaid,
          note: paymentNote || `Initial Bill Receipt · #${orderId.slice(0, 8).toUpperCase()}`,
          recordedBy: user?.id || "system",
          createdAt: ts,
        }),
      );
    }

    // Auto-apply existing advance credit: create a zero-cash settlement linking it to this order
    if (appliedAdvance > 0) {
      dispatch(
        addCustomerSettlement({
          id: crypto.randomUUID(),
          counterpartyId: customer.id,
          amount: 0, // no new cash — advance was already recorded previously
          mode: "CASH",
          allocations: [{ orderId, amount: appliedAdvance }],
          recordedBy: user?.id || "system",
          note: `Advance credit applied · #${orderId.slice(0, 8).toUpperCase()}`,
        }),
      );
    }

    navigate(`/orders/${order.id}`);
    toast.success(
      orderType === "TRANSFER"
        ? `Transfer initiated — ${items.length} device${items.length > 1 ? "s" : ""} dispatched`
        : `Sales order committed — ${items.length} device${items.length > 1 ? "s" : ""} sold`,
    );
  };

  const updateItem = (
    id: string,
    field: keyof Omit<OrderItemDraft, "phone">,
    val: any,
  ) => {
    setItems((currentItems) =>
      currentItems.map((it) => {
        if (it.phone.id !== id) return it;

        let finalVal = val;
        let finalItem = { ...it, [field]: finalVal };

        // Validation: Clamp percentage discounts between 0-100
        // Case A: Regular amount update in percent mode
        if (
          field === "discountAmount" &&
          it.discountType === "PERCENT" &&
          val !== ""
        ) {
          const numeric = parseFloat(val) || 0;
          if (numeric > 100) finalItem.discountAmount = "100";
          if (numeric < 0) finalItem.discountAmount = "0";
        }

        // Case B: Switching mode to PERCENT with a high existing amount
        if (field === "discountType" && val === "PERCENT") {
          const numeric = parseFloat(it.discountAmount) || 0;
          if (numeric > 100) finalItem.discountAmount = "100";
        }

        return finalItem;
      }),
    );
  };

  const removeItem = (id: string) => {
    setItems(items.filter((it) => it.phone.id !== id));
  };

  const handleAddDevice = () => {
    if (!canUse("bulk_orders") && items.length >= 1) {
      showUpgrade("bulk_orders");
      return;
    }
    setSelectorOpen(true);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 overflow-hidden"
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-0 shrink-0">
            <div className="w-10 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
          </div>

          {/* Header */}
          <SheetHeader className="px-4 py-3 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 mt-2">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
                <ShoppingCart
                  size={18}
                  className="text-primary-500"
                  strokeWidth={2.5}
                />
              </div>
              <div>
                <SheetTitle className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                  {isEditMode ? "Edit Order" : "Sales Order"}
                </SheetTitle>
                <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {isEditMode ? "Update order details" : "Sell devices"}
                </p>
              </div>
            </div>
          </SheetHeader>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto">
            <form
              id="order-form"
              onSubmit={handleSubmit}
              className="max-w-2xl mx-auto px-4 py-5 space-y-4 pb-28"
            >
              {/* ─── Order Type + Customer ────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
                {/* Order type tabs */}
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  {(["RETAIL", "BULK", "TRANSFER"] as const).map((type) => {
                    const isLocked =
                      type === "BULK"
                        ? !canUse("bulk_orders")
                        : type === "TRANSFER"
                          ? !canUse("trade_network")
                          : false;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          if (type === "BULK" && isLocked) {
                            showUpgrade("bulk_orders");
                            return;
                          }
                          if (type === "TRANSFER" && isLocked) {
                            showUpgrade("trade_network");
                            return;
                          }
                          setOrderType(type);
                        }}
                        className={clsx(
                          "flex-1 py-3 text-xs font-black uppercase tracking-widest transition-all",
                          orderType === type
                            ? "bg-primary-500 text-white"
                            : isLocked
                              ? "bg-white dark:bg-slate-900 text-slate-300 dark:text-slate-600"
                              : "bg-white dark:bg-slate-900 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                        )}
                      >
                        {type} {isLocked && "🔒"}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                    Customer / Counterparty
                  </label>
                  <CustomerPicker
                    selectedId={customer?.id}
                    onSelect={handleCustomerSelect}
                  />
                  {/* Transfer info banner — shown when TRANSFER type is active */}
                  {orderType === "TRANSFER" && customer?.linkedTenantId && (
                    <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-900/40 rounded-lg">
                      <span className="text-violet-500 shrink-0 mt-0.5">🔗</span>
                      <p className="text-[11px] font-bold text-violet-700 dark:text-violet-400">
                        A Purchase Order will be automatically created on <strong>{customer.linkedTenantName ?? "their"}</strong> account
                      </p>
                    </div>
                  )}
                  {orderType === "TRANSFER" && !customer?.linkedTenantId && customer && (
                    <div className="flex items-start gap-2 mt-2 px-3 py-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40 rounded-lg">
                      <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                      <p className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        {customer.name} is not linked to a StockFlow business. Link them via Trade Code first.
                      </p>
                    </div>
                  )}
                  {/* Advance credit banner */}
                  {arAdvance > 0 && (
                    <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-900/40 rounded-lg">
                      <Sparkles size={12} className="text-teal-500 shrink-0" />
                      <p className="text-[11px] font-bold text-teal-700 dark:text-teal-400">
                        ₹{Math.min(arAdvance, totalAmount || arAdvance).toLocaleString()} advance credit will be auto-applied to this order
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ─── Devices in Cart ──────────────────────────────────── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
                  <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                    Devices
                    {items.length > 0 && (
                      <span className="ml-2 text-xs font-bold bg-primary-500/10 text-primary-500 px-2 py-0.5 rounded-md">
                        {items.length}
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    {/* Discount toggle — compact */}
                    <button
                      type="button"
                      onClick={() => setShowDiscounts(!showDiscounts)}
                      className={clsx(
                        "size-8 rounded-lg flex items-center justify-center transition-all active:scale-95",
                        showDiscounts
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
                      )}
                      title={
                        showDiscounts ? "Hide discounts" : "Show discounts"
                      }
                    >
                      <Percent size={14} strokeWidth={2.5} />
                    </button>
                    {/* Add device button */}
                    <button
                      type="button"
                      onClick={handleAddDevice}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-500 text-[11px] font-bold active:scale-95 transition-all"
                    >
                      <Smartphone size={13} strokeWidth={2.5} />
                      Add
                    </button>
                  </div>
                </div>

                {items.length === 0 ? (
                  <button
                    type="button"
                    onClick={handleAddDevice}
                    className="w-full py-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 hover:border-primary-500/40 hover:text-primary-500 transition-all"
                  >
                    <Smartphone size={22} strokeWidth={1.5} />
                    <span className="text-sm font-bold">
                      Select devices to sell
                    </span>
                    <span className="text-xs font-medium opacity-60">
                      Tap to open device picker
                    </span>
                  </button>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => {
                      const price = parseFloat(item.salePrice) || 0;
                      const discountVal = parseFloat(item.discountAmount) || 0;
                      const discountAmt =
                        item.discountType === "PERCENT"
                          ? price * (discountVal / 100)
                          : discountVal;
                      const effective = Math.max(0, price - discountAmt);

                      const repairs = ledgerEntries
                        .filter(
                          (e) =>
                            e.type === "REPAIR_COST" &&
                            e.referenceId === item.phone.id,
                        )
                        .reduce((s, e) => s + Math.abs(e.amount), 0);
                      const totalCost = item.phone.purchasePrice + repairs;
                      const projectedPrice = Math.round(totalCost * 1.25);

                      return (
                        <div
                          key={item.phone.id}
                          className="bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-2">
                              <div className="size-6 bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 rounded-md flex items-center justify-center text-[10px] font-black shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-tight">
                                  {item.phone.brand} {item.phone.model}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                  {item.phone.storage} · {item.phone.color} ·{" "}
                                  {item.phone.imeis?.[0]
                                    ? `**** ${item.phone.imeis[0].slice(-4)}`
                                    : "No IMEI"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {discountAmt > 0 && (
                                <span className="text-[10px] font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-500 px-1.5 py-0.5 rounded">
                                  -₹{discountAmt.toLocaleString("en-IN")}
                                </span>
                              )}
                              <span className="text-sm font-black text-primary-500">
                                ₹{effective.toLocaleString("en-IN")}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeItem(item.phone.id)}
                                className="size-6 rounded-md bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 hover:text-rose-500 transition-all"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>

                          <div
                            className={clsx(
                              "p-3 grid gap-x-3 gap-y-1.5",
                              showDiscounts
                                ? "grid-cols-[2fr_1fr]"
                                : "grid-cols-1",
                            )}
                          >
                            {/* Headers Section */}
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                                Sale Price
                              </label>
                              <span className="text-[9px] font-black text-rose-500/70 dark:text-rose-400/50 uppercase tracking-tight">
                                Cost: ₹{totalCost.toLocaleString("en-IN")}
                              </span>
                            </div>
                            {showDiscounts && (
                              <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">
                                  Discount
                                </label>
                                <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(
                                        item.phone.id,
                                        "discountType",
                                        "FIXED",
                                      )
                                    }
                                    className={clsx(
                                      "px-2 py-0.5 rounded-md text-[10px] font-black transition-all",
                                      item.discountType === "FIXED"
                                        ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                                    )}
                                  >
                                    ₹
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateItem(
                                        item.phone.id,
                                        "discountType",
                                        "PERCENT",
                                      )
                                    }
                                    className={clsx(
                                      "px-2 py-0.5 rounded-md text-[10px] font-black transition-all",
                                      item.discountType === "PERCENT"
                                        ? "bg-white dark:bg-slate-700 text-primary-600 shadow-sm"
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                                    )}
                                  >
                                    %
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Inputs Section */}
                            <CurrencyInput
                              size="sm"
                              value={item.salePrice}
                              onChange={(v) =>
                                updateItem(item.phone.id, "salePrice", v)
                              }
                              placeholder={String(projectedPrice)}
                            />
                            {showDiscounts && (
                              <CurrencyInput
                                size="sm"
                                value={item.discountAmount}
                                symbol={
                                  item.discountType === "PERCENT" ? "%" : "₹"
                                }
                                onChange={(v) =>
                                  updateItem(item.phone.id, "discountAmount", v)
                                }
                                placeholder="0"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ─── GST Toggle (only if tenant has GSTIN) ────────────── */}
              {tenant?.gstin && !isEditMode && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
                  <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="size-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <Receipt size={16} className="text-emerald-600" strokeWidth={2.5} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                          Apply GST
                        </p>
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 leading-none mt-0.5">
                          {gstEnabled
                            ? `18% inclusive · HSN 8517 · ${gstType === "IGST" ? "IGST" : "CGST + SGST"}`
                            : "Issue a GST tax invoice"}
                        </p>
                      </div>
                    </div>
                    {/* Toggle switch */}
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
                      <span
                        className={clsx(
                          "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
                          gstEnabled ? "translate-x-6" : "translate-x-1",
                        )}
                      />
                    </button>
                  </div>

                  {/* Expanded GST details */}
                  {gstEnabled && (
                    <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3 space-y-3">
                      {/* Seller GSTIN info */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-500">Your GSTIN</span>
                        <span className="font-black text-slate-700 dark:text-slate-300 font-mono">
                          {tenant.gstin}
                        </span>
                      </div>

                      {/* Buyer GSTIN input */}
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                          Customer GSTIN <span className="font-normal normal-case text-slate-400">(optional — for B2B)</span>
                        </label>
                        <input
                          type="text"
                          value={buyerGstin}
                          onChange={(e) => setBuyerGstin(e.target.value.toUpperCase())}
                          maxLength={15}
                          placeholder={customer?.gstin || "e.g. 27AAACR5055K1ZF"}
                          className={clsx(
                            "w-full h-10 px-3 rounded-xl border-2 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all bg-slate-50 dark:bg-slate-800",
                            buyerGstin.length === 15
                              ? isValidGstin(buyerGstin)
                                ? "border-emerald-400 focus:border-emerald-500"
                                : "border-rose-400 focus:border-rose-500"
                              : "border-slate-100 dark:border-slate-700 focus:border-emerald-400",
                          )}
                        />
                        {buyerGstin.length === 15 && !isValidGstin(buyerGstin) && (
                          <p className="text-[10px] text-rose-500 font-semibold mt-1">
                            Invalid GSTIN format
                          </p>
                        )}
                      </div>

                      {/* Tax type badge */}
                      <div className={clsx(
                        "flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold",
                        gstType === "IGST"
                          ? "bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400"
                          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400",
                      )}>
                        <span>{gstType === "IGST" ? "Inter-state supply → IGST" : "Intra-state supply → CGST + SGST"}</span>
                        <span>{DEFAULT_GST_RATE}%</span>
                      </div>

                      {/* Live breakdown */}
                      {gstBreakdown && items.length > 0 && (
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
                            <span>Total (incl. tax)</span>
                            <span>₹{gstBreakdown.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ─── Fiscal Settlement (Hybrid Multi-Channel) ─────────── */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] overflow-hidden">
                <div className="px-4 pt-4 pb-3 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm">
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
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="p-4 space-y-4">
                  {/* Payment channel tabs with dot badges */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
                      Payment Channel
                    </label>
                    <div className="flex gap-2 bg-slate-50 dark:bg-slate-950 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
                      {(["CASH", "UPI", "BANK_TRANSFER"] as const).map((m) => {
                        const channelVal =
                          m === "CASH"
                            ? cashPaid
                            : m === "UPI"
                              ? upiPaid
                              : bankPaid;
                        const hasValue = channelVal > 0;
                        return (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setActivePayTab(m)}
                            className={clsx(
                              "flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-tight transition-all relative",
                              activePayTab === m
                                ? "bg-white dark:bg-slate-800 text-primary-500 shadow-sm"
                                : "text-slate-400 hover:text-slate-600",
                            )}
                          >
                            {m.replace("_", " ")}
                            {/* Dot badge when channel has a value */}
                            {hasValue && (
                              <span className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-800" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Active channel amount input */}
                  <div className="animate-in fade-in duration-150">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                      {activePayTab.replace("_", " ")} Amount
                    </label>
                    {activePayTab === "CASH" && (
                      <CurrencyInput
                        size="md"
                        value={cashStr}
                        onChange={setCashStr}
                        placeholder="0"
                      />
                    )}
                    {activePayTab === "UPI" && (
                      <CurrencyInput
                        size="md"
                        value={upiStr}
                        onChange={setUpiStr}
                        placeholder="0"
                      />
                    )}
                    {activePayTab === "BANK_TRANSFER" && (
                      <CurrencyInput
                        size="md"
                        value={bankStr}
                        onChange={setBankStr}
                        placeholder="0"
                      />
                    )}
                  </div>

                  {/* Channel breakdown — show active channels */}
                  {totalPaid > 0 && (
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
                      placeholder="Invoice remarks, special instructions…"
                      className="w-full h-11 px-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 outline-none transition-all"
                    />
                  </div>

                  {/* Summary row */}
                  <div className="pt-2 border-t border-slate-50 dark:border-slate-800 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span>Amount Received</span>
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
                        ₹{totalAmount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* Automatic credit due date — shows whenever outstanding > 0 */}
                  {requiresDueDate && (
                    <div className="animate-in slide-in-from-top-2 duration-200 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-800/40 rounded-xl p-3 space-y-2">
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        Credit Settlement — Due Date Required
                      </p>
                      <input
                        type="date"
                        value={dueDateStr}
                        onChange={(e) => setDueDateStr(e.target.value)}
                        min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                        className="w-full h-11 px-3 rounded-xl border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:border-amber-500 outline-none transition-colors"
                      />
                    </div>
                  )}
                </div>
              </div>
            </form>
          </div>

          {/* Sticky Submit */}
          <div className="px-4 py-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="submit"
              form="order-form"
              disabled={isExpired}
              className={clsx(
                "w-full py-4 rounded-2xl font-black text-base shadow-lg flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]",
                isExpired
                  ? "bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
                  : "bg-primary-500 hover:bg-blue-800 text-white shadow-blue-900/20",
              )}
            >
              <ShoppingCart size={20} strokeWidth={2.5} />
              {isExpired ? "Subscription Expired" : isEditMode ? "Save Changes" : "Commit Sales Ledger"}
            </button>
          </div>
        </SheetContent>
      </Sheet>

      <PhoneSelectorSheet
        open={selectorOpen}
        onOpenChange={setSelectorOpen}
        selectedIds={items.map((it) => it.phone.id)}
        onSelect={(phones) => {
          const currentIds = new Set(items.map((i) => i.phone.id));
          const newItems = phones
            .filter((p) => !currentIds.has(p.id))
            .map((p) => ({
              phone: p,
              salePrice: p.salePrice ? String(p.salePrice) : "",
              discountAmount: "",
              discountType: "FIXED" as const,
            }));
          const confirmIds = new Set(phones.map((p) => p.id));
          const retained = items.filter((it) => confirmIds.has(it.phone.id));
          setItems([...retained, ...newItems]);
        }}
      />
    </>
  );
}
