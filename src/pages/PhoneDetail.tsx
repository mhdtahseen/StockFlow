import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CurrencyInput from "../components/ui/CurrencyInput";
import { useAppSelector, useAppDispatch } from "../app/hooks";
import { useAuth } from "../context/AuthContext";
import {
  markAsInStock,
  markAsSold,
  removePhone,
  addRepairLog,
  removeRepairLog,
} from "../features/inventory/slice";
import { addEntry, removeEntry } from "../features/ledger/slice";
import {
  markPOItemAccepted,
  markPOItemRejected,
} from "../features/purchasing/slice";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  ChevronLeft,
  CheckCircle2,
  DollarSign,
  PenSquare,
  Smartphone,
  ShieldAlert,
  TrendingUp,
  Package,
  Wrench,
  Plus,
  ChevronDown,
  Trash2,
  Pencil,
  X,
  TrendingDown,
} from "lucide-react";
import clsx from "clsx";
import ReusableAutocomplete from "../components/ui/ReusableAutocomplete";
import { repairsFlatList } from "../data/repairCatalog";
import { CreateOrderSheet } from "../components/shared/CreateOrderSheet";
import HeaderActions from "@/components/layout/HeaderActions";
import { issuesFlatList, severityColorMap } from "../data/issueCatalog";

export default function PhoneDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch = useAppDispatch();
  const phone = useAppSelector((state) =>
    state.inventory.phones.find((p) => p.id === id),
  );
  const saleEntry = useAppSelector((state) =>
    state.ledger.entries.find(
      (e) => e.type === "PHONE_SALE" && e.referenceId === id,
    ),
  );

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasePriceInput, setPurchasePriceInput] = useState("");
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairAmount, setRepairAmount] = useState("");
  const [repairNote, setRepairNote] = useState("");
  const [repairAccordionOpen, setRepairAccordionOpen] = useState(false);
  // Inline editing state: repairId → { note, amount }
  const [editingRepairId, setEditingRepairId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const ledgerEntries = useAppSelector((state) => state.ledger.entries);
  // All repair costs tied to this phone (sorted oldest first)
  const repairEntries = useMemo(() => {
    return [...ledgerEntries]
      .filter((e) => e.type === "REPAIR_COST" && e.referenceId === id)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
  }, [ledgerEntries, id]);
  const totalRepairCost = useMemo(
    () => repairEntries.reduce((sum, e) => sum + Math.abs(e.amount), 0),
    [repairEntries],
  );

  if (!phone) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        <Package size={48} strokeWidth={1} className="text-slate-300 mb-4" />
        <p className="font-bold text-slate-700 dark:text-slate-300">
          Device not found
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-primary-500 font-bold text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const effectiveCostBasis = phone.purchasePrice + totalRepairCost;
  const expectedSalePrice = effectiveCostBasis * 1.25;
  const marginPercentage = phone.salePrice
    ? ((phone.salePrice - effectiveCostBasis) / effectiveCostBasis) * 100
    : 25.0;

  const handleConfirmPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchasePriceInput || Number(purchasePriceInput) <= 0) return;
    const finalPrice = Number(purchasePriceInput);
    const pledgedAmount = phone.purchasePrice; // original escrow amount
    const now = new Date().toISOString();

    // 1. Adjust escrow if final price differs from pledged amount
    if (finalPrice > pledgedAmount) {
      // Need more money — pledge the difference from wallet → lien
      dispatch(
        addEntry({
          id: crypto.randomUUID(),
          type: "FUNDS_PLEDGED",
          referenceId: phone.id,
          amount: -(finalPrice - pledgedAmount), // NEGATIVE for wallet deduction
          note: `PURCHASE - ${phone.brand} ${phone.model} : Cost adjustment (Increase)`,
          recordedBy: user?.id || 'system',
          createdAt: now,
        }),
      );
    } else if (finalPrice < pledgedAmount) {
      // Overpledged — release the surplus from lien → wallet
      dispatch(
        addEntry({
          id: crypto.randomUUID(),
          type: "FUNDS_RELEASED",
          referenceId: phone.id,
          amount: pledgedAmount - finalPrice,
          note: `PURCHASE - ${phone.brand} ${phone.model} : Cost adjustment (Surplus)`,
          recordedBy: user?.id || 'system',
          createdAt: now,
        }),
      );
    }

    // 2. Consume the final amount from lien → purchases
    dispatch(
      addEntry({
        id: crypto.randomUUID(),
        type: "FUNDS_CONSUMED",
        referenceId: phone.id,
        amount: -finalPrice, // NEGATIVE for consumption from lien
        note: `PURCHASE - ${phone.brand} ${phone.model} : Confirmed and added to stock`,
        recordedBy: user?.id || 'system',
        createdAt: now,
      }),
    );

    // 3. Update inventory status + price
    dispatch(markAsInStock({ id: phone.id, finalPrice }));

    // 4. PO-aware logic: if phone has a purchaseOrderId, mark PO item as accepted
    if ((phone as any).purchaseOrderId) {
      dispatch(
        markPOItemAccepted({
          purchaseOrderId: (phone as any).purchaseOrderId,
          phoneId: phone.id,
          finalPrice,
        }),
      );
    }

    setShowPurchaseModal(false);
    toast.success("Purchase Confirmed", {
      description: `${phone.brand} ${phone.model} moved to In Stock.${(phone as any).purchaseOrderId ? " Purchase order updated." : ""}`,
    });
  };

  const handleLogRepair = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repairAmount || Number(repairAmount) <= 0) return;
    const amount = Number(repairAmount);
    
    // WATCHTOWER AUTO-LOGS: addRepairLog triggers the ledger entry
    dispatch(
      addRepairLog({
        phoneId: phone.id,
        amount,
        note: repairNote.trim() || 'General Maintenance',
        recordedBy: user?.id || 'system',
      })
    );

    toast.success("Repair Cost Logged", {
      description: `₹${amount} repair expense recorded for ${phone.brand} ${phone.model}.`,
    });
    setRepairAmount("");
    setRepairNote("");
    setShowRepairModal(false);
    setRepairAccordionOpen(true);
  };

  const handleDeleteRepair = (entryId: string) => {
    // WATCHTOWER VOID LOGIC: removeRepairLog handles the reversal/cleanup
    dispatch(removeRepairLog({ phoneId: phone.id, entryId }));
    toast.success("Repair entry removed");
  };

  const handleSaveRepairEdit = (entry: { id: string; createdAt: string }) => {
    if (!editAmount || Number(editAmount) <= 0) return;
    
    // Logic: Remove old, add new -> Watchtower creates the audit trail
    dispatch(removeRepairLog({ phoneId: phone.id, entryId: entry.id }));
    dispatch(
      addRepairLog({
        phoneId: phone.id,
        amount: Number(editAmount),
        note: `${editNote.trim() || 'General Maintenance'} (Updated)`,
        recordedBy: user?.id || 'system',
      })
    );
    
    setEditingRepairId(null);
    setEditNote("");
    setEditAmount("");
    toast.success("Repair entry updated");
  };

  const statusConfig = {
    PENDING: {
      color:
        "bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      label: "Pending Verification",
    },
    IN_STOCK: {
      color:
        "bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      label: "In Stock",
    },
    SOLD: {
      color:
        "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      label: "Sold",
    },
  };
  const status = statusConfig[phone.status];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-6 transition-colors duration-300">
      {phone.status !== "SOLD" && (
        <HeaderActions>
          <button
            onClick={() => navigate(`/edit/${phone.id}`)}
            className="size-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95 shadow-sm"
            title="Edit Phone"
          >
            <PenSquare size={18} />
          </button>
        </HeaderActions>
      )}

      <div className="flex-1 overflow-y-auto">
        <main className="px-4 pt-4 pb-12 max-w-lg mx-auto w-full space-y-5">
        {/* Device Identity Card */}
        <section className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
          {phone.status === "SOLD" && (
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-50 rounded-full flex items-end justify-start p-5">
              <CheckCircle2 size={22} className="text-emerald-500" />
            </div>
          )}

          <div className="flex items-start gap-3 mb-4 relative z-10">
            <div
              className={clsx(
                "size-12 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                phone.status === "SOLD"
                  ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                  : phone.status === "IN_STOCK"
                    ? "bg-blue-50 dark:bg-blue-950 text-primary-500 dark:text-blue-400"
                    : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
              )}
            >
              <Smartphone size={22} />
            </div>
            <div className="flex-1 pr-12">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {phone.brand} {phone.model}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                {phone.storage} • {phone.color} • {phone.ram}
              </p>
              <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                IMEI:{" "}
                {phone.imeis &&
                phone.imeis.filter((i) => i.length >= 4).length > 0 ? (
                  <span className="text-slate-700 dark:text-slate-300 tracking-widest">
                    {phone.imeis
                      .filter((i) => i.length >= 4)
                      .map((i) => `*** • ${i.slice(-4)}`)
                      .join(" / ")}
                  </span>
                ) : (
                  <span className="text-slate-300 dark:text-slate-600">—</span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={clsx(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md border",
                status.color,
              )}
            >
              {status.label}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">
              Added {format(parseISO(phone.createdAt), "MMM d, yyyy")}
            </span>
            {phone.status === "SOLD" && saleEntry && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                • Sold {format(parseISO(saleEntry.createdAt), "MMM d, yyyy")}
              </span>
            )}
          </div>

          {phone.issueTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              {phone.issueTags.map((tag) => {
                const item = issuesFlatList.find(
                  (i) => i.label === tag || i.aliases?.includes(tag),
                );
                const severity = (item?.severity || 1) as 1 | 2 | 3 | 4 | 5;
                const colors = severityColorMap[severity];

                return (
                  <span
                    key={tag}
                    className={clsx(
                      "px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md flex items-center gap-1 border",
                      colors.bg,
                      colors.text,
                      colors.border,
                    )}
                  >
                    <ShieldAlert size={12} /> {tag}
                  </span>
                );
              })}
            </div>
          )}
        </section>

        {/* Financial Breakdown */}
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-50 dark:border-slate-800">
            <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <DollarSign size={16} className="text-primary-500" />
              Financial Breakdown
            </h3>
          </div>

          <div className="divide-y divide-slate-50 dark:divide-slate-800">
            <div className="p-4 flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                Purchase Cost
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {formatCurrency(phone.purchasePrice)}
              </span>
            </div>

            {/* Additional Expenses Accordion — only if repairs logged */}
            {repairEntries.length > 0 && (
              <div>
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setRepairAccordionOpen((o) => !o)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Additional Expenses
                    </span>
                    <span className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
                      {repairEntries.length}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                      {formatCurrency(totalRepairCost)}
                    </span>
                    <ChevronDown
                      size={15}
                      className={clsx(
                        "text-slate-400 transition-transform duration-200",
                        repairAccordionOpen ? "rotate-180" : "",
                      )}
                    />
                  </div>
                </button>

                {/* Accordion body */}
                {repairAccordionOpen && (
                  <div className="divide-y divide-slate-50 dark:divide-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30 border-y border-slate-50 dark:border-slate-800/50">
                    {repairEntries.map((r) => (
                      <div key={r.id}>
                        {editingRepairId === r.id ? (
                          // ── Inline edit form ────────────────────────────
                          <div className="px-4 py-3 space-y-2">
                            <input
                              type="text"
                              value={editNote}
                              onChange={(e) => setEditNote(e.target.value)}
                              placeholder="Description"
                              className="w-full text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-primary-500 dark:focus:border-blue-500"
                            />
                            <div className="flex gap-2 items-center">
                              <input
                                type="number"
                                value={editAmount}
                                onChange={(e) => setEditAmount(e.target.value)}
                                placeholder="Amount"
                                className="flex-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-slate-100 outline-none focus:border-primary-500 dark:focus:border-blue-500"
                              />
                              <button
                                onClick={() => handleSaveRepairEdit(r)}
                                className="px-3 py-2 bg-primary-500 hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingRepairId(null)}
                                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          // ── Read row ──────────────────────────────────────
                          <div className="px-4 py-2.5 flex items-center gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
                                {r.note || "Expense"}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                {format(parseISO(r.createdAt), "MMM d, yyyy")}
                              </p>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm mr-2">
                              {formatCurrency(r.amount)}
                            </span>
                            <button
                              onClick={() => {
                                setEditingRepairId(r.id);
                                setEditNote(r.note || "");
                                setEditAmount(String(r.amount));
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-primary-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                            >
                              <Pencil size={13} />
                            </button>
                            <button
                              onClick={() => handleDeleteRepair(r.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Effective cost basis if any repairs */}
            {totalRepairCost > 0 && (
              <div className="px-4 py-3 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                <span className="text-slate-600 dark:text-slate-300 font-bold text-sm">
                  Total Cost Basis
                </span>
                <span className="font-black text-slate-900 dark:text-slate-100">
                  {formatCurrency(phone.purchasePrice + totalRepairCost)}
                </span>
              </div>
            )}

            {phone.status === "SOLD" ? (
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Sale Price
                </span>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(phone.salePrice!)}
                </span>
              </div>
            ) : (
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  Projected Sale
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(expectedSalePrice)}
                </span>
              </div>
            )}

            <div className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "size-8 rounded-full flex items-center justify-center",
                    phone.status === "SOLD" && marginPercentage < 0
                      ? "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400"
                      : "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
                  )}
                >
                  {marginPercentage < 0 ? (
                    <TrendingDown size={16} />
                  ) : (
                    <TrendingUp size={16} />
                  )}
                </div>
                <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">
                  {phone.status === "SOLD"
                    ? marginPercentage < 0
                      ? "Actual Loss Margin"
                      : "Actual Profit Margin"
                    : "Est. Profit Margin"}
                </span>
              </div>
              <span
                className={clsx(
                  "font-black text-lg",
                  phone.status === "SOLD"
                    ? marginPercentage < 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                    : "text-primary-500 dark:text-blue-400",
                )}
              >
                {Math.abs(marginPercentage).toFixed(1)}%
              </span>
            </div>

            {phone.status === "SOLD" &&
              phone.salePrice &&
              (() => {
                const effectiveCost = phone.purchasePrice + totalRepairCost;
                const net = phone.salePrice - effectiveCost;
                const isLoss = net < 0;
                return (
                  <div
                    className={clsx(
                      "p-4 flex justify-between items-center",
                      isLoss
                        ? "bg-rose-50/60 dark:bg-rose-950/50"
                        : "bg-emerald-50/50 dark:bg-emerald-950/50",
                    )}
                  >
                    <span
                      className={clsx(
                        "font-bold text-sm",
                        isLoss
                          ? "text-rose-700 dark:text-rose-400"
                          : "text-emerald-700 dark:text-emerald-400",
                      )}
                    >
                      {isLoss ? "Loss" : "Profit"}
                    </span>
                    <div className="flex flex-col items-end">
                      <span
                        className={clsx(
                          "font-black text-lg leading-tight",
                          isLoss
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {isLoss ? "-" : "+"}
                        {formatCurrency(Math.abs(net))}
                      </span>
                      {totalRepairCost > 0 && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                          incl. ₹{totalRepairCost.toLocaleString("en-IN")}{" "}
                          repairs
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}
          </div>
        </section>

        {/* Status & Actions */}
        <section className="flex flex-col gap-3">
          {phone.status === "PENDING" && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
              <div className="bg-amber-50 dark:bg-amber-950 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                <p className="text-amber-800 dark:text-amber-300 text-sm font-semibold">
                  Verify device condition before finalizing purchase.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    dispatch(removePhone(phone.id));
                    dispatch(
                      addEntry({
                        id: crypto.randomUUID(),
                        type: "FUNDS_RELEASED",
                        referenceId: phone.id,
                        amount: Math.abs(phone.purchasePrice),
                        note: `REJECTION - ${phone.brand} ${phone.model} : Inspection failed, funds released`,
                        recordedBy: user?.id || 'system',
                        createdAt: new Date().toISOString(),
                      }),
                    );

                    // PO-aware logic: if phone has a purchaseOrderId, mark PO item as rejected
                    if ((phone as any).purchaseOrderId) {
                      dispatch(
                        markPOItemRejected({
                          purchaseOrderId: (phone as any).purchaseOrderId,
                          phoneId: phone.id,
                          reason: "Unit rejected during inspection",
                        }),
                      );
                    }

                    navigate("/inventory");
                    toast.error("Unit Rejected", {
                      description: `${phone.brand} ${phone.model} removed from inventory. Escrowed funds released.${(phone as any).purchaseOrderId ? " Purchase order updated." : ""}`,
                    });
                  }}
                  className="flex-[0.4] bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-bold py-3.5 rounded-xl border border-rose-200 dark:border-rose-800 active:bg-rose-50 transition-colors text-sm"
                >
                  Reject Unit
                </button>
                <button
                  onClick={() => {
                    setPurchasePriceInput(String(phone.purchasePrice));
                    setShowPurchaseModal(true);
                  }}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 rounded-xl shadow-sm active:scale-[0.98] transition-all text-sm"
                >
                  Confirm Purchase
                </button>
              </div>
            </div>
          )}

          {phone.status === "IN_STOCK" && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.08)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col gap-4">
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-primary-500 dark:text-blue-400 text-sm font-semibold">
                  Device is currently in your active inventory.
                </p>
              </div>

              {/* Repair history moved to accordion in Financial Breakdown */}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowRepairModal(true)}
                  className="flex-[0.45] flex items-center justify-center gap-1.5 bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-400 font-bold py-3.5 rounded-xl border border-amber-200 dark:border-amber-800 active:scale-[0.98] transition-all text-sm"
                >
                  <Wrench size={16} /> Repair
                </button>
                <button
                  onClick={() => setShowSaleModal(true)}
                  className="flex-1 bg-primary-500 hover:bg-blue-800 dark:hover:bg-blue-900 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-900/20 active:scale-[0.98] transition-all text-sm"
                >
                  Create Sales Order
                </button>
              </div>
            </div>
          )}

          {phone.status === "SOLD" &&
            (() => {
              const isLoss =
                phone.salePrice != null &&
                phone.salePrice < phone.purchasePrice;
              return (
                <div
                  className={clsx(
                    "p-4 rounded-xl border flex items-center justify-center",
                    isLoss
                      ? "bg-rose-50 dark:bg-rose-950 border-rose-100 dark:border-rose-800"
                      : "bg-emerald-50 dark:bg-emerald-950 border-emerald-100 dark:border-emerald-800",
                  )}
                >
                  <p
                    className={clsx(
                      "font-bold uppercase tracking-wider text-sm flex items-center gap-2",
                      isLoss
                        ? "text-rose-700 dark:text-rose-400"
                        : "text-emerald-700 dark:text-emerald-400",
                    )}
                  >
                    <CheckCircle2 size={18} />
                    {isLoss ? "Sold at a Loss" : "Transaction Complete"}
                  </p>
                </div>
              );
            })()}
        </section>
      </main>
    </div>
      {/* Sale Modal via CreateOrderSheet */}
      <CreateOrderSheet
        open={showSaleModal}
        onOpenChange={setShowSaleModal}
        initialPhones={[phone]}
      />

      {/* Purchase Confirmation Modal */}
      {showPurchaseModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl dark:shadow-black/40 border border-transparent dark:border-slate-800">
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-1 tracking-tight">
              Confirm Purchase
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">
              Enter the final price paid for this device.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6 font-medium">
              Negotiated:{" "}
              <span className="font-bold text-slate-600 dark:text-slate-300">
                {formatCurrency(phone.purchasePrice)}
              </span>
            </p>

            <form onSubmit={handleConfirmPurchase}>
              <div className="mb-6">
                <CurrencyInput
                  value={purchasePriceInput}
                  onChange={setPurchasePriceInput}
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="flex-[0.5] py-3.5 font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3.5 font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  Confirm & Add to Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Repair Cost Modal */}
      {showRepairModal && (
        <div className="fixed inset-0 bg-slate-900/40 dark:bg-black/60 z-60 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl dark:shadow-black/40 border border-transparent dark:border-slate-800">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-10 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wrench size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Log Repair Cost
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  {phone.brand} {phone.model}
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 mt-3 font-medium">
              This will be tracked as an expense tied to this device and
              deducted from profit calculations.
            </p>

            <form onSubmit={handleLogRepair}>
              {/* Description */}
              <div className="mb-4">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  What was repaired?
                </label>
                <ReusableAutocomplete
                  data={repairsFlatList}
                  value={repairNote}
                  onChange={setRepairNote}
                  placeholder="e.g. Screen replacement, Battery swap…"
                  autoFocus
                />
              </div>

              {/* Amount */}
              <div className="mb-6">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                  Repair Cost
                </label>
                <CurrencyInput
                  value={repairAmount}
                  onChange={setRepairAmount}
                  className="rounded-2xl border-amber-200 dark:border-amber-800 focus:border-amber-400"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRepairModal(false);
                    setRepairAmount("");
                    setRepairNote("");
                  }}
                  className="flex-[0.5] py-3.5 font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!repairAmount || Number(repairAmount) <= 0}
                  className="flex-1 py-3.5 font-semibold text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:pointer-events-none rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  Log Repair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
