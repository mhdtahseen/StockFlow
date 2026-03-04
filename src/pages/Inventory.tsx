import React, { useState, useMemo, useRef, useEffect } from "react";
import { useAppSelector } from "../app/hooks";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import clsx from "clsx";
import { PhoneStatus, Phone } from "../features/inventory/types";
import {
  Package,
  History,
  Smartphone,
  Search,
  X,
  ChevronRight,
  SlidersHorizontal,
  ArrowUpDown,
  Layers,
  Fingerprint,
  Cpu,
  ArrowDown,
  TrendingUp,
  Clock,
} from "lucide-react";
import {
  formatDistanceToNow,
  differenceInHours,
  isYesterday,
  format,
} from "date-fns";

export type TabOption = PhoneStatus | "ALL";
const VALID_TABS: TabOption[] = ["ALL", "IN_STOCK", "PENDING", "SOLD"];

type SortOption = "newest" | "oldest" | "price_high" | "price_low" | "brand_az";

export default function Inventory() {
  const { phones } = useAppSelector((state) => state.inventory);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as TabOption | null;
  const activeTab: TabOption =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "ALL";

  const [showSearch, setShowSearch] = useState(false);
  const [query, setQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearch]);

  const setActiveTab = (tab: TabOption) => {
    setSearchParams({ tab });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // All unique brands for the filter
  const allBrands = useMemo(() => {
    const set = new Set(phones.map((p) => p.brand));
    return Array.from(set).sort();
  }, [phones]);

  // Filter + search + sort
  const filteredPhones = useMemo(() => {
    let result =
      activeTab === "ALL"
        ? phones
        : phones.filter((p) => p.status === activeTab);

    // Text search across brand, model, color, storage, tags, imei, ram
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      const qStripped = q.replace(/\s+/g, "");

      result = result.filter(
        (p) =>
          p.brand.toLowerCase().includes(q) ||
          p.brand.toLowerCase().replace(/\s+/g, "").includes(qStripped) ||
          p.model.toLowerCase().includes(q) ||
          p.model.toLowerCase().replace(/\s+/g, "").includes(qStripped) ||
          p.color.toLowerCase().includes(q) ||
          p.storage.toLowerCase().includes(q) ||
          p.storage.toLowerCase().replace(/\s+/g, "").includes(qStripped) ||
          p.ram.toLowerCase().includes(q) ||
          p.ram.toLowerCase().replace(/\s+/g, "").includes(qStripped) ||
          p.issueTags.some((t) => t.toLowerCase().includes(q)) ||
          p.imeis?.some(
            (imei) =>
              imei.toLowerCase().includes(q) || imei.slice(-4).includes(q),
          ),
      );
    }

    // Brand filter
    if (filterBrand) {
      result = result.filter((p) => p.brand === filterBrand);
    }

    // Sort
    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "price_high":
          return (
            (b.salePrice || b.purchasePrice) - (a.salePrice || a.purchasePrice)
          );
        case "price_low":
          return (
            (a.salePrice || a.purchasePrice) - (b.salePrice || b.purchasePrice)
          );
        case "brand_az":
          return (
            a.brand.localeCompare(b.brand) || a.model.localeCompare(b.model)
          );
        default:
          return 0;
      }
    });

    return result;
  }, [phones, activeTab, query, filterBrand, sortBy]);

  const getTabMetrics = () => {
    const count = filteredPhones.length;
    let value = 0;
    let label = "Total Value";

    if (activeTab === "IN_STOCK") {
      value = filteredPhones.reduce((sum, p) => sum + p.purchasePrice, 0);
      label = "Inventory Value";
    } else if (activeTab === "PENDING") {
      value = filteredPhones.reduce((sum, p) => sum + p.purchasePrice, 0);
      label = "Pledged Value";
    } else if (activeTab === "SOLD") {
      value = filteredPhones.reduce((sum, p) => sum + (p.salePrice || 0), 0);
    } else if (activeTab === "ALL") {
      value = filteredPhones.reduce(
        (sum, p) =>
          sum +
          (p.status === "SOLD" && p.salePrice ? p.salePrice : p.purchasePrice),
        0,
      );
      label = "Total Asset Value";
    }

    return { count, value, label };
  };

  const getRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const hours = differenceInHours(new Date(), date);

    if (hours < 24 && !isYesterday(date)) {
      const dist = formatDistanceToNow(date, { addSuffix: true }).replace(
        "about ",
        "",
      );
      if (dist.includes("less than a minute")) return "a few seconds ago";
      if (dist.includes("1 minute ago") || dist.includes("a minute ago"))
        return "1 min ago";
      return dist;
    }

    if (isYesterday(date)) return "yesterday";
    if (hours < 48) return "a day ago";

    return format(date, "do MMMM");
  };

  const { count, value, label } = getTabMetrics();

  const tabs: { value: TabOption; label: string; icon: React.ReactNode }[] = [
    { value: "ALL", label: "All", icon: <Layers size={16} /> },
    { value: "IN_STOCK", label: "In Stock", icon: <Package size={16} /> },
    { value: "PENDING", label: "Pending", icon: <Smartphone size={16} /> },
    { value: "SOLD", label: "Sold", icon: <History size={16} /> },
  ];

  const activeFilterCount =
    (filterBrand ? 1 : 0) + (sortBy !== "newest" ? 1 : 0);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-900 dark:text-slate-100 pb-20 relative transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        {/* Title row / Search row */}
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          {showSearch ? (
            <div className="flex-1 flex items-center gap-2 bg-slate-50 dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 transition-all">
              <Search
                size={18}
                className="text-slate-400 dark:text-slate-500 shrink-0"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search brand, model, color, tags..."
                className="flex-1 bg-transparent outline-none text-sm font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="text-slate-400 dark:text-slate-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ) : (
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Inventory
            </h1>
          )}
          <div className="flex gap-1.5 shrink-0">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                if (showSearch) setQuery("");
              }}
              className={clsx(
                "size-10 rounded-full flex items-center justify-center transition-colors",
                showSearch
                  ? "bg-[#064a98] text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
              )}
            >
              {showSearch ? <X size={20} /> : <Search size={20} />}
            </button>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={clsx(
                "size-10 rounded-full flex items-center justify-center transition-colors relative",
                showFilter
                  ? "bg-[#064a98] text-white"
                  : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400",
              )}
            >
              <SlidersHorizontal size={20} />
              {activeFilterCount > 0 && !showFilter && (
                <span className="absolute -top-0.5 -right-0.5 size-4 bg-[#064a98] text-white text-[9px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilter && (
          <div className="px-4 pb-3 space-y-3 border-t border-slate-50 dark:border-slate-800 pt-3">
            {/* Sort */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Sort By
              </p>
              <div className="flex gap-2 flex-wrap">
                {(
                  [
                    { value: "newest", label: "Newest" },
                    { value: "oldest", label: "Oldest" },
                    { value: "price_high", label: "Price ↓" },
                    { value: "price_low", label: "Price ↑" },
                    { value: "brand_az", label: "Brand A-Z" },
                  ] as { value: SortOption; label: string }[]
                ).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSortBy(s.value)}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      sortBy === s.value
                        ? "bg-[#064a98] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Brand filter */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Brand
              </p>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterBrand(null)}
                  className={clsx(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                    !filterBrand
                      ? "bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                  )}
                >
                  All
                </button>
                {allBrands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() =>
                      setFilterBrand(brand === filterBrand ? null : brand)
                    }
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      filterBrand === brand
                        ? "bg-[#064a98] text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700",
                    )}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>

            {/* Clear All */}
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  setSortBy("newest");
                  setFilterBrand(null);
                }}
                className="w-full py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 rounded-lg border border-rose-100 dark:border-rose-900 transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-[16px] shadow-inner text-sm font-semibold">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={clsx(
                  "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[12px] transition-all duration-200 uppercase tracking-wider text-[10px]",
                  activeTab === tab.value
                    ? "bg-primary-500 text-white shadow-sm font-bold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 font-medium",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24 z-10 w-full max-w-lg mx-auto flex flex-col gap-5">
        {/* Active search/filter indicator */}
        {(query || filterBrand) && (
          <div className="flex items-center gap-2 flex-wrap">
            {query && (
              <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900">
                Search: "{query}"
                <button onClick={() => setQuery("")}>
                  <X size={12} />
                </button>
              </span>
            )}
            {filterBrand && (
              <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400 text-xs font-bold px-2.5 py-1 rounded-md border border-blue-100 dark:border-blue-900">
                Brand: {filterBrand}
                <button onClick={() => setFilterBrand(null)}>
                  <X size={12} />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Metric Cards */}
        <div className="flex gap-4">
          <div className="bg-white dark:bg-slate-900 flex-[1.2] p-5 rounded-2xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#064a98]/5 dark:bg-blue-500/5 rounded-full blur-xl -mr-10 -mt-10 pointer-events-none"></div>
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#064a98] dark:bg-blue-400"></span>
              {label}
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {formatCurrency(value)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 flex-[0.8] p-5 rounded-2xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center">
            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Units
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {count}
            </p>
          </div>
        </div>

        {/* List */}
        <section className="flex flex-col gap-3">
          <div className="flex justify-between items-end mb-1 px-1">
            <h2 className="text-slate-800 dark:text-slate-200 font-bold tracking-tight text-sm uppercase">
              {activeTab === "ALL" && "All Tracker"}
              {activeTab === "IN_STOCK" && "Active Assets"}
              {activeTab === "PENDING" && "Units in Verification"}
              {activeTab === "SOLD" && "Trading History"}
            </h2>
          </div>

          <div
            key={activeTab}
            className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
          >
            {filteredPhones.length === 0 ? (
              <div className="text-center flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Package
                  size={40}
                  strokeWidth={1}
                  className="text-slate-300 dark:text-slate-600 mb-3"
                />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  {query || filterBrand ? "No matches" : "No units found"}
                </p>
                <p className="text-sm mt-1 text-slate-500 dark:text-slate-400 font-medium">
                  {query || filterBrand
                    ? "Try adjusting your search or filters."
                    : `There are no ${activeTab.toLowerCase().replace("_", " ")} devices.`}
                </p>
              </div>
            ) : (
              filteredPhones.map((phone) => (
                <Link
                  key={phone.id}
                  to={`/inventory/${phone.id}`}
                  className={clsx(
                    "bg-white dark:bg-slate-900 p-4 rounded-[1rem] shadow-sm hover:shadow-md border border-slate-100 dark:border-slate-800 block hover:border-primary-500/20 dark:hover:border-primary-500/30 active:scale-[0.98] transition-all group",
                    phone.status === "SOLD" && "opacity-90",
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 pr-4">
                      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 leading-tight">
                        {phone.brand} {phone.model}
                      </h3>
                      <div className="flex items-center gap-1 text-[12px] text-slate-400 font-mono mt-1.5">
                        <Fingerprint size={12} />
                        <span>
                          IMEI:{" "}
                          {phone.imeis &&
                          phone.imeis.length > 0 &&
                          phone.imeis[0].length >= 4
                            ? `•••• ${phone.imeis[0].slice(-4)}`
                            : "—"}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[12px] font-medium text-slate-500 mt-1">
                        <Cpu size={14} />
                        <span>
                          {phone.ram !== "N/A" ? `${phone.ram} / ` : ""}
                          {phone.storage} / {phone.color}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      {phone.status === "SOLD" && phone.salePrice ? (
                        <div
                          className={clsx(
                            "flex items-center gap-1 font-extrabold",
                            phone.salePrice - phone.purchasePrice >= 0
                              ? "text-emerald-500"
                              : "text-rose-500",
                          )}
                        >
                          {phone.salePrice - phone.purchasePrice >= 0 ? (
                            <TrendingUp size={14} />
                          ) : (
                            <ArrowDown size={14} />
                          )}
                          <span className="text-lg leading-none">
                            {formatCurrency(phone.salePrice)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-slate-900 dark:text-slate-100 leading-none">
                          {formatCurrency(phone.purchasePrice)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-2">
                      <Clock size={11} className="text-slate-400" />
                      <p className="text-[10px] uppercase font-bold text-slate-400">
                        {getRelativeDate(phone.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* ONLY SHOW ISSUES BADGE IF ISSUES EXIST */}
                      {phone.issueTags.length > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          {phone.issueTags.length}{" "}
                          {phone.issueTags.length === 1 ? "Issue" : "Issues"}
                        </span>
                      )}

                      {/* STATUS BADGE PLACED AT THE END */}
                      {activeTab === "ALL" && (
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border",
                            phone.status === "IN_STOCK"
                              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                              : phone.status === "PENDING"
                                ? "bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60",
                          )}
                        >
                          <span
                            className={clsx(
                              "size-1.5 rounded-full",
                              phone.status === "IN_STOCK"
                                ? "bg-emerald-500"
                                : phone.status === "PENDING"
                                  ? "bg-amber-500"
                                  : "bg-slate-400",
                            )}
                          ></span>
                          {phone.status.replace("_", " ")}
                        </span>
                      )}

                      {activeTab !== "ALL" && (
                        <span
                          className={clsx(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border",
                            activeTab === "IN_STOCK"
                              ? "bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                              : activeTab === "PENDING"
                                ? "bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                : "bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60",
                          )}
                        >
                          <span
                            className={clsx(
                              "size-1.5 rounded-full",
                              activeTab === "IN_STOCK"
                                ? "bg-emerald-500"
                                : activeTab === "PENDING"
                                  ? "bg-amber-500"
                                  : "bg-slate-400",
                            )}
                          ></span>
                          {activeTab.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
