import React, { useState, useMemo, useEffect } from "react";
import { useAppSelector } from "@/app/hooks";
import { useNavigate, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { formatDistanceToNowStrict } from "date-fns";
import { Search, ChevronRight, UserPlus, Filter, Phone, QrCode } from "lucide-react";
import { selectCustomers } from "@/features/customers/selectors";
import HeaderActions from "@/components/layout/HeaderActions";
import { CustomerPicker } from "@/components/ui/CustomerPicker";
import { ConnectSheet } from "@/components/shared/ConnectSheet";
import QrScannerModal from "@/components/shared/QrScannerModal";
import { usePlan } from "@/hooks/usePlan";
import { CustomerType } from "@/features/customers/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// A2: color-coded avatar by type
const TYPE_AVATAR: Record<CustomerType, string> = {
  CUSTOMER: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  RETAILER: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400",
  WHOLESALER: "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400",
  PLATFORM: "bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400",
};

const TYPE_BAR: Record<CustomerType, string> = {
  CUSTOMER: "bg-blue-400",
  RETAILER: "bg-violet-400",
  WHOLESALER: "bg-amber-400",
  PLATFORM: "bg-teal-400",
};

export default function Customers() {
  const customers = useAppSelector(selectCustomers);
  const allSaleOrders = useAppSelector((state) => state.billing.orders) || [];
  const allPurchaseOrders = useAppSelector((state) => state.purchasing.orders) || [];
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { canUse } = usePlan();

  const [connectOpen, setConnectOpen] = useState(false);
  const [connectCode, setConnectCode] = useState<string | undefined>(undefined);
  const [scannerOpen, setScannerOpen] = useState(false);

  // Handle deep link: /customers?connect=CODE
  useEffect(() => {
    const code = searchParams.get("connect");
    if (code && code.length === 6 && canUse("trade_network")) {
      setConnectCode(code.toUpperCase());
      setConnectOpen(true);
    }
  }, [searchParams, canUse]);

  // A4: precompute per-customer last activity + order count + AR balance
  const customerStats = useMemo(() => {
    const map = new Map<string, { lastActivity: string | null; orderCount: number; arBalance: number }>();
    customers.forEach((c) => {
      const saleOrders = allSaleOrders.filter((o) => o.counterpartyId === c.id);
      const purchaseOrders = allPurchaseOrders.filter((o) => o.counterpartyId === c.id);
      const allDates = [
        ...saleOrders.map((o) => o.createdAt),
        ...purchaseOrders.map((o) => o.createdAt),
      ].sort().reverse();
      const arBalance = saleOrders
        .filter((o) => o.status !== "SETTLED" && o.status !== "RETURNED")
        .reduce((s, o) => s + (o.totalAmount - o.amountPaid), 0);
      map.set(c.id, {
        lastActivity: allDates[0] ?? null,
        orderCount: saleOrders.length + purchaseOrders.length,
        arBalance,
      });
    });
    return map;
  }, [customers, allSaleOrders, allPurchaseOrders]);


  const fuse = new Fuse(customers, {
    keys: ["name", "phone"],
    threshold: 0.3,
  });

  const searched = search.trim()
    ? fuse.search(search).map((r) => r.item)
    : customers;

  const filtered = filterType === "ALL"
    ? searched
    : searched.filter(c => c.type === filterType);

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <HeaderActions>
        <React.Fragment>
          {canUse("trade_network") && (
            <button
              onClick={() => setScannerOpen(true)}
              className="size-10 rounded-full bg-violet-500 text-white flex items-center justify-center transition-all shadow-lg shadow-violet-500/20 active:scale-95"
              title="Scan to Connect"
            >
              <QrCode size={20} />
            </button>
          )}
          <CustomerPicker
            mode="add"
            onSelect={(c) => navigate(`/customers/${c.id}`)}
            trigger={
              <button className="size-10 rounded-full bg-primary-500 text-white flex items-center justify-center transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                <UserPlus size={20} />
              </button>
            }
          />
        </React.Fragment>
      </HeaderActions>

      {/* A7: Sticky search + filter */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 px-4 pt-4 pb-3 md:px-8 md:max-w-5xl md:mx-auto md:w-full">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm focus:border-primary-500 outline-none transition-colors"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-12 px-3 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 font-semibold focus:ring-0">
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <SelectValue placeholder="Type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Types</SelectItem>
              <SelectItem value="CUSTOMER">Customer</SelectItem>
              <SelectItem value="RETAILER">Retailer</SelectItem>
              <SelectItem value="WHOLESALER">Wholesaler</SelectItem>
              <SelectItem value="PLATFORM">Platform</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {/* A7: result count */}
        {search.trim() && (
          <p className="text-[11px] font-bold text-slate-400 mt-2 px-1">Showing {filtered.length} of {customers.length}</p>
        )}
      </div>

      <div className="px-4 pt-2 pb-24 md:px-8 md:max-w-5xl md:mx-auto md:w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.length === 0 ? (
            <div className="col-span-full">
              {customers.length === 0 ? (
                // A6: Actionable empty state
                <div className="text-center py-16 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <div className="size-16 rounded-full bg-primary-50 dark:bg-primary-900/20 text-primary-500 flex items-center justify-center mx-auto mb-4">
                    <UserPlus size={24} />
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 font-bold mb-1">No customers yet</p>
                  <p className="text-xs text-slate-400 font-medium mb-5">Add your first customer to start tracking orders and payments.</p>
                  <CustomerPicker
                    mode="add"
                    onSelect={(c) => navigate(`/customers/${c.id}`)}
                    trigger={
                      <button className="px-5 py-2.5 bg-primary-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all text-sm">
                        Add Your First Customer
                      </button>
                    }
                  />
                </div>
              ) : (
                <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
                  <p className="text-slate-500 font-semibold">No customers match your search.</p>
                </div>
              )}
            </div>
          ) : (
            filtered.map((c) => {
              const stats = customerStats.get(c.id);
              const lastActivity = stats?.lastActivity;
              const orderCount = stats?.orderCount ?? 0;
              const arBalance = stats?.arBalance ?? 0;
              const type = (c.type as CustomerType) ?? "CUSTOMER";
              return (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex cursor-pointer active:scale-[0.98] transition-all group hover:shadow-md hover:border-slate-200 dark:hover:border-slate-700"
              >
                {/* Type accent bar */}
                <div className={`w-1 shrink-0 ${TYPE_BAR[type]}`} />

                <div className="flex items-center gap-3 px-4 py-3.5 flex-1 min-w-0">
                  {/* Avatar */}
                  <div className={`size-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${TYPE_AVATAR[type]}`}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-[15px] text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {c.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[9px] uppercase tracking-widest font-black text-slate-400">
                        {c.type}
                      </span>
                      {c.phone && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700 text-[9px]">·</span>
                          <span className="text-[10px] font-semibold text-slate-400 truncate">{c.phone}</span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      {orderCount > 0 && (
                        <span className="text-[10px] font-bold text-slate-400">
                          {orderCount} order{orderCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {arBalance > 0 && (
                        <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded-md">
                          ₹{arBalance >= 100000 ? `${(arBalance / 100000).toFixed(1)}L` : arBalance >= 1000 ? `${(arBalance / 1000).toFixed(1)}K` : arBalance.toLocaleString()} due
                        </span>
                      )}
                      {!arBalance && lastActivity && (
                        <span className="text-[10px] font-medium text-slate-400">
                          {formatDistanceToNowStrict(new Date(lastActivity), { addSuffix: true })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="size-8 rounded-full text-slate-300 dark:text-slate-600 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center justify-center transition-colors"
                      >
                        <Phone size={13} />
                      </a>
                    )}
                    <ChevronRight
                      size={16}
                      className="text-slate-300 dark:text-slate-700 group-hover:text-primary-500 transition-colors ml-0.5"
                    />
                  </div>
                </div>
              </div>
              );
            })
          )}
        </div>
      </div>

      <ConnectSheet
        open={connectOpen}
        onOpenChange={setConnectOpen}
        initialCode={connectCode}
      />

      <QrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={(code) => {
          setScannerOpen(false);
          setConnectCode(code);
          setConnectOpen(true);
        }}
        onManualEntry={() => {
          setScannerOpen(false);
          setConnectCode(undefined);
          setConnectOpen(true);
        }}
      />
    </div>
  );
}
