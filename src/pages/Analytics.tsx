import React, { useState } from "react";
import { useAppSelector } from "../app/hooks";
import {
  selectCashflowSummary,
  selectInventoryMetrics,
  TimePeriod,
} from "../features/analytics/selectors";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  format,
  subDays,
  subMonths,
  endOfDay,
  subHours,
  startOfHour,
  parseISO,
} from "date-fns";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "../components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import clsx from "clsx";
import { TrendingUp, Clock, Package, Calendar } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { issuesFlatList, severityColorMap } from "../data/issueCatalog";

export default function Analytics() {
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const summary = useAppSelector(selectCashflowSummary(period));
  const metrics = useAppSelector(selectInventoryMetrics);
  const entries = useAppSelector((state) => state.ledger.entries);
  const phones = useAppSelector((state) => state.inventory.phones);
  const { resolved } = useTheme();
  const isDark = resolved === "dark";

  const plugin = React.useRef(
    Autoplay({ delay: 30000, stopOnInteraction: true }),
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const periodLabels: Record<TimePeriod, string> = {
    daily: "Today",
    weekly: "This Week",
    monthly: format(new Date(), "MMM"),
    quarterly: "Q" + Math.ceil((new Date().getMonth() + 1) / 3),
    halfYearly: "6 Months",
    annually: format(new Date(), "yyyy"),
  };

  // 1. Chart Data: Sales vs Expenditure Trend
  const cashflowChartData = React.useMemo(() => {
    const data = [];
    const today = new Date();

    if (period === "daily") {
      for (let i = 23; i >= 0; i--) {
        const d = subHours(today, i);
        const hourStr = format(d, "h a");
        const periodStart = startOfHour(d).getTime();
        const periodEnd = periodStart + 3600000 - 1;

        let sales = 0;
        let expense = 0;

        entries.forEach((e) => {
          const entryTime = new Date(e.createdAt).getTime();
          if (entryTime >= periodStart && entryTime <= periodEnd) {
            if (e.type === "PHONE_SALE") sales += e.amount;
            if (e.type === "FUNDS_CONSUMED") expense += Math.abs(e.amount);
          }
        });

        data.push({ name: hourStr, Revenue: sales, Expenditure: expense });
      }
    } else if (period === "weekly" || period === "monthly") {
      const days = period === "monthly" ? 30 : 7;
      for (let i = days - 1; i >= 0; i--) {
        const d = subDays(today, i);
        const dayStr = format(d, "MMM dd");

        let sales = 0;
        let expense = 0;

        entries.forEach((e) => {
          if (format(new Date(e.createdAt), "MMM dd") === dayStr) {
            if (e.type === "PHONE_SALE") sales += e.amount;
            if (e.type === "FUNDS_CONSUMED") expense += Math.abs(e.amount);
          }
        });

        data.push({ name: dayStr, Revenue: sales, Expenditure: expense });
      }
    } else if (period === "quarterly") {
      for (let i = 11; i >= 0; i--) {
        const d = subDays(today, i * 7);
        const weekStr = format(d, "MMM dd");
        const periodEndEnd = endOfDay(d).getTime();
        const periodStart = endOfDay(subDays(today, (i + 1) * 7)).getTime();

        let sales = 0;
        let expense = 0;

        entries.forEach((e) => {
          const entryTime = new Date(e.createdAt).getTime();
          if (entryTime > periodStart && entryTime <= periodEndEnd) {
            if (e.type === "PHONE_SALE") sales += e.amount;
            if (e.type === "FUNDS_CONSUMED") expense += Math.abs(e.amount);
          }
        });

        data.push({ name: weekStr, Revenue: sales, Expenditure: expense });
      }
    } else {
      const months = period === "annually" ? 12 : 6;
      for (let i = months - 1; i >= 0; i--) {
        const d = subMonths(today, i);
        const monthStr = format(d, "MMM yyyy");

        let sales = 0;
        let expense = 0;

        entries.forEach((e) => {
          if (format(new Date(e.createdAt), "MMM yyyy") === monthStr) {
            if (e.type === "PHONE_SALE") sales += e.amount;
            if (e.type === "FUNDS_CONSUMED") expense += Math.abs(e.amount);
          }
        });

        data.push({ name: monthStr, Revenue: sales, Expenditure: expense });
      }
    }

    return data;
  }, [entries, period]);

  // 2. Chart Data: Profit Margin Trend
  const marginChartData = React.useMemo(() => {
    return [...phones]
      .filter((p) => p.status === "SOLD")
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      )
      .map((p, idx) => {
        const profit = (p.salePrice || 0) - p.purchasePrice;
        const marginPct = ((profit / p.purchasePrice) * 100).toFixed(1);
        return {
          name: `#${idx + 1} ${p.brand}`,
          Margin: parseFloat(marginPct),
          Profit: profit,
        };
      });
  }, [phones]);

  // 3. Chart Data: Brand Wise Sales (Pie Chart)
  const brandSalesData = React.useMemo(() => {
    const brandMap: Record<string, number> = {};
    phones.forEach((p) => {
      if (p.status === "SOLD") {
        if (!brandMap[p.brand]) brandMap[p.brand] = 0;
        brandMap[p.brand] += p.salePrice || 0;
      }
    });
    return Object.keys(brandMap).map((brand) => ({
      name: brand,
      value: brandMap[brand],
    }));
  }, [phones]);
  const COLORS = [
    "#064a98",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
  ];

  // 4. Common Issues Data
  const issueData = React.useMemo(() => {
    const tagMap: Record<string, number> = {};
    let total = 0;
    phones.forEach((p) => {
      p.issueTags.forEach((tag) => {
        tagMap[tag] = (tagMap[tag] || 0) + 1;
        total++;
      });
    });

    return Object.entries(tagMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Show top 5 instead of 4
      .map(([tag, count]) => {
        // Find severity to color match it properly
        const catalogItem = issuesFlatList.find(
          (i) => i.label === tag || i.aliases?.includes(tag),
        );
        const severity = catalogItem?.severity || 1;
        const colorData = severityColorMap[severity];

        // We map severity Tailwind hex to basic semantic tailwind solid colors for the bars
        // as we can't easily animate dynamic hex backgrounds with basic tailwind `bg-` classes.
        // We'll just pass inline styles for background!

        return {
          label: tag,
          pct: total > 0 ? Math.round((count / total) * 100) : 0,
          colorCode: colorData.bg,
          textColorCode: colorData.text,
        };
      });
  }, [phones]);

  // Net Change calculation
  const netChange = summary.netOperatingCashflow;
  const netChangePct =
    summary.capitalInvested > 0
      ? ((netChange / summary.capitalInvested) * 100).toFixed(1)
      : "0.0";

  const gridLine = isDark ? "#1e293b" : "#f1f5f9";
  const tickColor = isDark ? "#64748b" : "#94a3b8";
  const tooltipBg = isDark ? "#1e293b" : "#fff";
  const tooltipBorder = isDark ? "#334155" : "#e2e8f0";

  const periods: { value: TimePeriod; label: string }[] = [
    { value: "daily", label: "Daily" },
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "annually", label: "Annually" },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950 pb-6 font-sans antialiased text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-30 flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 pt-[calc(0.75rem+env(safe-area-inset-top,0px))] pb-3 justify-between border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
        <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Analytics
        </h1>
        <button className="size-10 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">
          <Calendar size={20} />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pb-12 space-y-4 pt-4">
        {/* Period Selector — Concept A pill toggle */}
        <div className="bg-slate-100/80 dark:bg-slate-800/80 p-1.5 rounded-xl flex">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={clsx(
                "flex-1 py-2 text-xs font-medium rounded-lg transition-all",
                period === p.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm font-bold"
                  : "text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50",
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Hero Period Summary Card — Concept A blue card */}
        <div className="bg-[#064a98] dark:bg-[#0a3a7a] rounded-xl p-6 shadow-lg shadow-blue-900/20 dark:shadow-blue-950/40 text-white relative overflow-hidden">
          <div className="absolute -right-8 -top-8 size-40 bg-white/10 dark:bg-white/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-8 -bottom-8 size-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10">
            <h2 className="text-white/80 text-sm font-medium mb-6">
              Period Summary ({periodLabels[period]})
            </h2>

            <div className="grid grid-cols-2 gap-y-6">
              <div>
                <p className="text-white/60 text-xs font-medium mb-1">
                  Gross Sales
                </p>
                <p className="text-xl font-bold tracking-tight">
                  {formatCurrency(summary.grossSales)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-xs font-medium mb-1">
                  Expenditure
                </p>
                <p className="text-xl font-bold tracking-tight">
                  {formatCurrency(summary.capitalInvested)}
                </p>
              </div>

              <div className="col-span-2 pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <p className="text-white/60 text-xs font-medium mb-1">
                    Net Cashflow
                  </p>
                  <p
                    className={clsx(
                      "text-2xl font-bold tracking-tight",
                      netChange >= 0 ? "text-emerald-300" : "text-rose-300",
                    )}
                  >
                    {netChange > 0 ? "+" : ""}
                    {formatCurrency(netChange)}
                  </p>
                </div>
                <div
                  className={clsx(
                    "flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold",
                    netChange >= 0
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-rose-500/20 text-rose-300",
                  )}
                >
                  <TrendingUp size={14} />
                  {netChangePct}%
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profit Trends Chart — Concept A white card with area chart */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              Profit Trends
            </h3>
            <div className="flex gap-2 items-center">
              <span className="size-2 rounded-full bg-[#064a98]"></span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Net Income
              </span>
            </div>
          </div>
          <div className="h-48 w-full">
            {cashflowChartData.some(
              (d) => d.Revenue > 0 || d.Expenditure > 0,
            ) ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={cashflowChartData}
                  margin={{ top: 5, right: 5, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="profitGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#064a98"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#064a98" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke={gridLine}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: tickColor, fontWeight: 700 }}
                    dy={8}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 10, fill: tickColor }}
                    tickFormatter={(val) =>
                      `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "12px",
                      border: `1px solid ${tooltipBorder}`,
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      background: tooltipBg,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [
                      formatCurrency(value),
                      undefined,
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="Revenue"
                    stroke="#064a98"
                    strokeWidth={3}
                    fill="url(#profitGradient)"
                    dot={{
                      r: 3,
                      fill: "#fff",
                      stroke: "#064a98",
                      strokeWidth: 2,
                    }}
                    activeDot={{ r: 5, fill: "#064a98" }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm font-medium">
                No data available for this period
              </div>
            )}
          </div>
        </div>

        {/* Common Issues — Concept A progress bars */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 dark:text-slate-100">
              Common Issues
            </h3>
            <span className="text-[#064a98] dark:text-blue-400 text-xs font-bold">
              See All
            </span>
          </div>
          <div className="space-y-5">
            {issueData.length > 0 ? (
              issueData.map((issue) => (
                <div key={issue.label}>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: issue.colorCode }}
                      ></span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {issue.label}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {issue.pct}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${issue.pct}%`,
                        backgroundColor: issue.colorCode,
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-4">
                No issue data yet
              </p>
            )}
          </div>
        </div>

        {/* Charts Carousel — Revenue/Expenditure, Margin Trend, Brand Share */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800">
          <Carousel
            className="w-full relative"
            plugins={[plugin.current]}
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {/* Chart 1: Revenue vs Expenditure */}
              <CarouselItem>
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-emerald-500"></span>
                  Revenue vs Expenditure
                </h2>
                <div className="h-56 w-full">
                  {cashflowChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={cashflowChartData}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={gridLine}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 10,
                            fill: tickColor,
                            fontWeight: 600,
                          }}
                          dy={8}
                          interval="preserveStartEnd"
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: tickColor }}
                          tickFormatter={(val) =>
                            `₹${val >= 1000 ? (val / 1000).toFixed(0) + "k" : val}`
                          }
                        />
                        <Tooltip
                          cursor={{
                            fill: isDark
                              ? "rgba(255,255,255,0.05)"
                              : "rgba(0,0,0,0.03)",
                          }}
                          contentStyle={{
                            borderRadius: "12px",
                            border: `1px solid ${tooltipBorder}`,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            background: tooltipBg,
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            undefined,
                          ]}
                        />
                        <Legend
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                        />
                        <Bar
                          dataKey="Revenue"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                          fill="#10B981"
                        />
                        <Bar
                          dataKey="Expenditure"
                          radius={[6, 6, 0, 0]}
                          maxBarSize={32}
                          fill="#EF4444"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      No data available
                    </div>
                  )}
                </div>
              </CarouselItem>

              {/* Chart 2: Profit Margin Trend */}
              <CarouselItem>
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-[#064a98]"></span>
                  Profit Margin Trend
                </h2>
                <div className="h-56 w-full">
                  {marginChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={marginChartData}
                        margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke={gridLine}
                        />
                        <XAxis
                          dataKey="name"
                          axisLine={false}
                          tickLine={false}
                          tick={{
                            fontSize: 9,
                            fill: tickColor,
                            fontWeight: 600,
                          }}
                          dy={8}
                        />
                        <YAxis
                          yAxisId="left"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 10, fill: tickColor }}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: `1px solid ${tooltipBorder}`,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            background: tooltipBg,
                            fontSize: 12,
                          }}
                          formatter={(value: number, name: string) => [
                            name === "Margin"
                              ? `${value}%`
                              : formatCurrency(value),
                            name,
                          ]}
                        />
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="Margin"
                          stroke="#064a98"
                          strokeWidth={3}
                          dot={{
                            r: 3,
                            fill: "#fff",
                            stroke: "#064a98",
                            strokeWidth: 2,
                          }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      Make some sales to see margin trends
                    </div>
                  )}
                </div>
              </CarouselItem>

              {/* Chart 3: Brand Wise Sales */}
              <CarouselItem>
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-5 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-amber-500"></span>
                  Brand Market Share
                </h2>
                <div className="h-56 w-full flex items-center justify-center">
                  {brandSalesData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={brandSalesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                          strokeWidth={0}
                        >
                          {brandSalesData.map((_entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: `1px solid ${tooltipBorder}`,
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                            background: tooltipBg,
                            fontSize: 12,
                          }}
                          formatter={(value: number) => [
                            formatCurrency(value),
                            undefined,
                          ]}
                        />
                        <Legend
                          layout="vertical"
                          verticalAlign="middle"
                          align="right"
                          iconType="circle"
                          wrapperStyle={{ fontSize: 11 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-400 dark:text-slate-500 text-sm">
                      No sales data available
                    </div>
                  )}
                </div>
              </CarouselItem>
            </CarouselContent>
          </Carousel>
        </div>

        {/* Bottom Metric Widgets — Concept A 2-col grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-center">
            <div className="size-8 rounded-full bg-blue-50 dark:bg-blue-950 text-[#064a98] dark:text-blue-400 flex items-center justify-center mx-auto mb-2">
              <Clock size={16} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Avg. Sale Time
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics.avgTimeOnShelfDays > 0
                ? metrics.avgTimeOnShelfDays.toFixed(1)
                : "0"}{" "}
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                days
              </span>
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-center">
            <div className="size-8 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
              <Package size={16} />
            </div>
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Units In Stock
            </p>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {metrics.inStockCount}
            </p>
          </div>
        </div>

        {/* Pledged & Avg Profit — compact row */}
        <div className="grid grid-cols-2 gap-3 pb-8">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Pledged Escrow
            </p>
            <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
              {formatCurrency(summary.pledgedCapital)}
            </p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-center">
            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">
              Avg Profit %
            </p>
            <p
              className={clsx(
                "text-xl font-bold",
                metrics.avgMargin >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400",
              )}
            >
              {metrics.avgMargin.toFixed(1)}%
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
