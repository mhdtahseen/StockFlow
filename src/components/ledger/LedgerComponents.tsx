import React from "react";
import { format, parseISO } from "date-fns";
import { 
  ArrowRightLeft, 
  Banknote, 
  Landmark, 
  Package, 
  ShoppingBag, 
  Wrench,
  Calendar
} from "lucide-react";
import clsx from "clsx";

interface TransactionItemProps {
  entry: any;
  phones: any[];
  runningBalance?: number;
  dailyTotal?: number;
  customSummaryLabel?: string;
  formatCurrency: (amount: number) => string;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  entry,
  phones,
  runningBalance,
  dailyTotal,
  customSummaryLabel,
  formatCurrency
}) => {
  const isPositive = ["CAPITAL_INJECTION", "CUSTOMER_PAYMENT", "PHONE_SALE", "FUNDS_RELEASED"].includes(entry.type);

  const getDetails = (entry: any) => {
    switch (entry.type) {
      case "CAPITAL_INJECTION":
        return {
          label: "Capital Top Up",
          icon: <Landmark size={20} />,
          color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
          note: "Owner Investment",
        };
      case "CUSTOMER_PAYMENT":
        return {
          label: "Bill Settlement (AR)",
          icon: <Landmark size={20} />,
          color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
          note: "Customer Collection",
        };
      case "SUPPLIER_PAYMENT":
        return {
          label: "Supplier Settlement (AP)",
          icon: <Landmark size={20} />,
          color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
          note: "Liability Payout",
        };
      case "WITHDRAWAL":
        return {
          label: "Owner Withdrawal",
          icon: <Banknote size={20} />,
          color: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
          note: "Personal Takeout",
        };
      case "PROFIT_WITHDRAWAL":
        return {
          label: "Profit Withdrawal",
          icon: <Banknote size={20} />,
          color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400",
          note: "Taking Profits",
        };
      case "FUNDS_PLEDGED": {
        const p = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: p ? `Pending: ${p.brand} ${p.model}` : "Capital Pledged",
          icon: <ArrowRightLeft size={20} />,
          color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
          note: "Escrow Locked",
        };
      }
      case "FUNDS_RELEASED": {
        const r = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: r ? `Refund: ${r.brand} ${r.model}` : "Pledge Released",
          icon: <ArrowRightLeft size={20} />,
          color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
          note: "Escrow Refunded",
        };
      }
      case "FUNDS_CONSUMED": {
        const c = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: c ? `${c.brand} ${c.model} Purchase` : "Inventory Acquisition",
          icon: <Package size={20} />,
          color: "bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400",
          note: "Acquisition",
        };
      }
      case "REPAIR_COST": {
        const rp = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: rp ? `Repair: ${rp.brand} ${rp.model}` : "Repair Expense",
          icon: <Wrench size={20} />,
          color: "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
          note: (entry as any).note || "Repair Cost",
        };
      }
      case "PHONE_SALE": {
        const s = phones.find((ph) => ph.id === entry.referenceId);
        return {
          label: s ? `${s.brand} ${s.model}` : "Phone Sale",
          icon: <ShoppingBag size={20} />,
          color: "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400",
          note: s ? `Sale ID: #${s.id.slice(0, 4)}` : "Sale",
        };
      }
      default:
        return {
          label: "Unknown",
          icon: <ArrowRightLeft size={20} />,
          color: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
          note: "",
        };
    }
  };

  const details = getDetails(entry);

  return (
    <div className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
      <div className="flex items-center gap-4">
        <div className={clsx("size-10 rounded-full flex items-center justify-center shrink-0 shadow-sm", details.color)}>
          {details.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h4 className="font-bold text-slate-900 dark:text-slate-100 truncate pr-2">
              {details.label}
            </h4>
            <span className={clsx("font-bold whitespace-nowrap text-sm", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
              {isPositive ? "+" : "-"}
              {formatCurrency(Math.abs(entry.amount))}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 dark:text-slate-400 truncate">
              {details.note} • {format(parseISO(entry.createdAt), "h:mm a")}
            </span>
            {runningBalance !== undefined ? (
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Balance: {formatCurrency(runningBalance)}
              </span>
            ) : dailyTotal !== undefined && (
              <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                {customSummaryLabel || "Summary"}: {formatCurrency(dailyTotal)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const EmptyTransactions: React.FC<{ hasFilter?: boolean }> = ({ hasFilter }) => (
  <div className="text-center text-slate-500 dark:text-slate-400 py-10 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-2">
    <Calendar size={32} strokeWidth={1} className="text-slate-300 dark:text-slate-600" />
    <p className="font-bold text-slate-700 dark:text-slate-300">No transactions found</p>
    <p className="text-sm text-slate-500 dark:text-slate-400">
      {hasFilter ? "Try adjusting your filters or date range." : "Your transaction history will appear here."}
    </p>
  </div>
);
