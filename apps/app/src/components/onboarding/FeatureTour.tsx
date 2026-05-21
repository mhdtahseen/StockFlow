import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Smartphone, ShoppingCart, FileText,
  Banknote, TrendingUp, Users, UserCircle, PanelLeft,
  ChevronRight, X, ArrowRight, ArrowLeft, Package,
  Check, Menu, Plus, Bell,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "react-router-dom";
import posthog from "@/lib/posthog";

export const FEATURE_TOUR_KEY = "finventree_feature_tour_shown";

// ─── Shared Mobile Chrome Shell ─────────────────────────────────────────────

function MobileChrome({
  title,
  back = false,
  activeTab,
  children,
}: {
  title: string;
  back?: boolean;
  activeTab?: "home";
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 bg-white border-b border-slate-100 shrink-0">
        {back ? (
          <ArrowLeft size={10} className="text-slate-600" />
        ) : (
          <Menu size={10} className="text-slate-600" />
        )}
        <span className="text-[8px] font-bold text-slate-900">{title}</span>
        <Bell size={9} className="text-slate-400" />
      </div>
      {/* Content */}
      <div className="flex-1 overflow-hidden">{children}</div>
      {/* Bottom Nav */}
      <div className="flex items-end justify-around bg-white border-t border-slate-100 px-4 pt-1 pb-1 shrink-0">
        <div className={`flex flex-col items-center gap-0.5 ${
          activeTab === "home" ? "text-primary-500" : "text-slate-400"
        }`}>
          <LayoutDashboard size={10} />
          <span className="text-[5px] font-semibold">Home</span>
        </div>
        <div className="size-8 rounded-xl bg-primary-500 flex items-center justify-center -mt-4 shadow-lg shadow-primary-500/40 border-[1.5px] border-white shrink-0">
          <Plus size={12} strokeWidth={3} className="text-white" />
        </div>
        <div className="flex flex-col items-center gap-0.5 text-slate-400">
          <Menu size={10} />
          <span className="text-[5px] font-semibold">Menu</span>
        </div>
      </div>
    </div>
  );
}

// ─── Mini Screen Mockups (Mobile / PWA) ──────────────────────────────────────

function SidebarScreen() {
  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard" },
    { icon: Smartphone, label: "Inventory" },
    { icon: ShoppingCart, label: "Purchase Orders", active: true },
    { icon: FileText, label: "Sales Orders" },
    { icon: Banknote, label: "Ledger" },
    { icon: TrendingUp, label: "Analytics" },
    { icon: Users, label: "Customers" },
  ];
  return (
    <div className="flex h-full overflow-hidden">
      {/* Slide-in drawer */}
      <div className="w-[130px] bg-slate-900 h-full flex flex-col shrink-0">
        {/* User strip */}
        <div className="px-2 pt-2.5 pb-2 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="size-6 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
              <span className="text-[7px] font-black text-white">A</span>
            </div>
            <div className="min-w-0">
              <div className="text-[7px] font-bold text-white truncate">Ahmed Khan</div>
              <div className="text-[5.5px] text-slate-400 truncate">Raju Mobile Shop</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <div className="flex-1 py-2 px-1.5 flex flex-col gap-0.5 overflow-hidden">
          <p className="text-[5px] text-slate-500 uppercase font-bold tracking-wider px-1 mb-0.5">Operations</p>
          {navItems.map(({ icon: Icon, label, active }: any) => (
            <div
              key={label}
              className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md ${
                active ? "bg-primary-600 text-white" : "text-slate-400"
              }`}
            >
              <Icon size={8} />
              <span className="text-[6.5px] font-medium truncate">{label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Dimmed content behind */}
      <div className="flex-1 bg-black/50 flex items-start pt-2 pl-1.5">
        <span className="text-[6px] text-white/60 bg-black/20 px-1.5 py-0.5 rounded font-medium">Tap outside to close</span>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <MobileChrome title="Dashboard" activeTab="home">
      <div className="overflow-y-auto h-full px-2 py-1.5 flex flex-col gap-1.5">
        {/* Hero card */}
        <div className="bg-blue-600 rounded-xl p-2.5 text-white shrink-0">
          <p className="text-[5.5px] uppercase tracking-widest text-white/60">Net Cash Flow</p>
          <p className="text-[15px] font-black leading-tight">₹1,24,500</p>
          <div className="flex gap-1.5 mt-1">
            <span className="bg-black/20 px-1 py-0.5 rounded text-[5.5px] text-emerald-300">↑ ₹45k Sales</span>
            <span className="bg-black/20 px-1 py-0.5 rounded text-[5.5px] text-white/70">₹82k Stock</span>
          </div>
        </div>
        {/* Metric grid */}
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Purchases", val: "₹1.2L", b: "border-b-rose-500" },
            { label: "Sales", val: "₹45,000", b: "border-b-emerald-500" },
            { label: "Avg Profit", val: "₹1,200", b: "border-b-blue-500" },
            { label: "In Stock", val: "38 units", b: "border-b-amber-500" },
          ].map(({ label, val, b }) => (
            <div key={label} className={`bg-white rounded-lg px-2 py-1.5 shadow-sm border-b-2 ${b}`}>
              <p className="text-[5px] uppercase tracking-wider text-slate-400 font-bold">{label}</p>
              <p className="text-[8px] font-black text-slate-900 mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

function InventoryScreen() {
  return (
    <MobileChrome title="Inventory">
      <div className="flex flex-col h-full">
        {/* Search + filters */}
        <div className="px-2 pt-1.5 pb-1 bg-white border-b border-slate-100 shrink-0">
          <div className="bg-slate-100 rounded-lg px-2 py-1 flex items-center gap-1.5 mb-1">
            <div className="size-1.5 rounded-full border border-slate-400" />
            <span className="text-[6.5px] text-slate-400">Search IMEI, model…</span>
          </div>
          <div className="flex gap-1">
            {["All", "In Stock", "Pending", "Sold"].map((t, i) => (
              <span key={t} className={`text-[5.5px] font-bold px-1.5 py-0.5 rounded-full ${
                i === 0 ? "bg-primary-500 text-white" : "bg-slate-100 text-slate-500"
              }`}>{t}</span>
            ))}
          </div>
        </div>
        {/* List */}
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1">
          {[
            { name: "iPhone 15 Pro Max", brand: "Apple", c: "bg-blue-50 text-blue-600", label: "In Stock", price: "₹89,000" },
            { name: "Samsung Galaxy S24+", brand: "Samsung", c: "bg-amber-50 text-amber-600", label: "Pending", price: "₹72,000" },
            { name: "Redmi Note 13 Pro", brand: "Xiaomi", c: "bg-emerald-50 text-emerald-600", label: "Sold", price: "₹18,500" },
            { name: "Vivo V30 Pro", brand: "Vivo", c: "bg-blue-50 text-blue-600", label: "In Stock", price: "₹38,000" },
          ].map(({ name, brand, c, label, price }) => (
            <div key={name} className="bg-white rounded-lg p-1.5 flex items-center gap-1.5 shadow-sm">
              <div className="size-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <Smartphone size={9} className="text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[6.5px] font-bold text-slate-900 truncate">{name}</div>
                <div className="text-[5.5px] text-slate-400">{brand}</div>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <span className={`text-[5px] font-bold px-1 py-0.5 rounded-full ${c}`}>{label}</span>
                <span className="text-[5.5px] font-bold text-slate-700">{price}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

function PurchaseOrdersScreen() {
  return (
    <MobileChrome title="Purchase Orders">
      <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1">
        {[
          { id: "PO-042", sup: "Raju Mobile Traders", items: 8, amount: "₹1,24,500", status: "Certified", c: "bg-emerald-50 text-emerald-700" },
          { id: "PO-041", sup: "Sun Electronics", items: 5, amount: "₹88,000", status: "Pending", c: "bg-amber-50 text-amber-700" },
          { id: "PO-040", sup: "Galaxy Distributors", items: 12, amount: "₹2,10,000", status: "Certified", c: "bg-emerald-50 text-emerald-700" },
          { id: "PO-039", sup: "Star Mobile Hub", items: 3, amount: "₹41,500", status: "Draft", c: "bg-slate-100 text-slate-500" },
        ].map(({ id, sup, items, amount, status, c }) => (
          <div key={id} className="bg-white rounded-xl p-2 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[7px] font-black text-blue-600">{id}</span>
                <span className={`text-[5px] font-bold px-1 py-0.5 rounded-full ${c}`}>{status}</span>
              </div>
              <div className="text-[6.5px] text-slate-600 font-medium">{sup}</div>
              <div className="text-[5px] text-slate-400">{items} items</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-black text-slate-900">{amount}</div>
              <ChevronRight size={8} className="text-slate-300 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </MobileChrome>
  );
}

function OrderDetailsScreen() {
  return (
    <MobileChrome title="PO Details" back>
      <div className="flex flex-col h-full overflow-hidden">
        {/* PO header */}
        <div className="bg-white px-2.5 py-1.5 border-b border-slate-100 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[7.5px] font-black text-slate-900">PO-042</span>
            <span className="bg-emerald-50 text-emerald-700 text-[5.5px] font-bold px-1.5 py-0.5 rounded-full">✓ Certified</span>
          </div>
          <div className="text-[6px] text-slate-400">Raju Mobile Traders · 12 May 2026</div>
        </div>
        {/* Items */}
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1">
          <div className="text-[5.5px] uppercase text-slate-400 font-bold tracking-wider">Items (3)</div>
          {[
            { name: "iPhone 15 Pro", qty: 2, price: "₹89,000" },
            { name: "Samsung S24+", qty: 3, price: "₹72,000" },
          ].map(({ name, qty, price }) => (
            <div key={name} className="bg-white rounded-lg p-1.5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[6.5px] font-bold text-slate-900">{name}</div>
                <div className="text-[5px] text-slate-400">×{qty} units</div>
              </div>
              <div className="text-[6.5px] font-bold text-slate-700">{price}</div>
            </div>
          ))}
          {/* Payment */}
          <div className="bg-white rounded-lg p-1.5 shadow-sm">
            <div className="text-[5.5px] uppercase text-slate-400 font-bold tracking-wider mb-1">Payment</div>
            {[
              { label: "Total", val: "₹1,24,500", c: "text-slate-900" },
              { label: "Paid", val: "₹80,000", c: "text-emerald-600" },
              { label: "Balance Due", val: "₹44,500", c: "text-rose-600" },
            ].map(({ label, val, c }) => (
              <div key={label} className="flex justify-between mt-0.5">
                <span className="text-[5.5px] text-slate-500">{label}</span>
                <span className={`text-[6.5px] font-bold ${c}`}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MobileChrome>
  );
}

function SalesOrdersScreen() {
  return (
    <MobileChrome title="Sales Orders">
      <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1">
        {[
          { id: "SO-118", cust: "Ahmed Khan", amount: "₹45,000", status: "Paid", c: "bg-emerald-50 text-emerald-700" },
          { id: "SO-117", cust: "Priya Sharma", amount: "₹32,500", status: "Partial", c: "bg-amber-50 text-amber-700" },
          { id: "SO-116", cust: "Ravi Verma", amount: "₹89,000", status: "Paid", c: "bg-emerald-50 text-emerald-700" },
          { id: "SO-115", cust: "Ayesha Begum", amount: "₹18,500", status: "Due", c: "bg-rose-50 text-rose-700" },
        ].map(({ id, cust, amount, status, c }) => (
          <div key={id} className="bg-white rounded-xl p-2 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-1 mb-0.5">
                <span className="text-[7px] font-black text-emerald-700">{id}</span>
                <span className={`text-[5px] font-bold px-1 py-0.5 rounded-full ${c}`}>{status}</span>
              </div>
              <div className="text-[6.5px] text-slate-600 font-medium">{cust}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-black text-slate-900">{amount}</div>
              <ChevronRight size={8} className="text-slate-300 ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </MobileChrome>
  );
}

function LedgerScreen() {
  return (
    <MobileChrome title="Accounts Ledger">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Balance strip */}
        <div className="bg-white px-2.5 py-2 border-b border-slate-100 shrink-0">
          <div className="text-[5.5px] text-slate-400 uppercase tracking-wider">Available Balance</div>
          <div className="text-[15px] font-black text-slate-900 leading-tight">₹2,34,500</div>
          <div className="flex gap-1.5 mt-1">
            <div className="flex-1 bg-emerald-50 rounded-lg p-1">
              <div className="text-[5px] text-emerald-700 font-bold uppercase">Total In</div>
              <div className="text-[7.5px] font-black text-emerald-700">₹4,80,000</div>
            </div>
            <div className="flex-1 bg-rose-50 rounded-lg p-1">
              <div className="text-[5px] text-rose-700 font-bold uppercase">Total Out</div>
              <div className="text-[7.5px] font-black text-rose-700">₹2,45,500</div>
            </div>
          </div>
        </div>
        {/* Entries */}
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-0.5">
          {[
            { label: "SO-118 · Ahmed Khan", date: "20 May", amount: "+₹45,000", c: "text-emerald-600" },
            { label: "PO-042 Payment", date: "18 May", amount: "-₹80,000", c: "text-rose-600" },
            { label: "SO-117 · Priya Sharma", date: "17 May", amount: "+₹25,000", c: "text-amber-600" },
            { label: "SO-116 · Ravi Verma", date: "15 May", amount: "+₹89,000", c: "text-emerald-600" },
          ].map(({ label, date, amount, c }) => (
            <div key={label} className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[6.5px] font-bold text-slate-900">{label}</div>
                <div className="text-[5px] text-slate-400">{date}</div>
              </div>
              <span className={`text-[7.5px] font-black ${c}`}>{amount}</span>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

function AnalyticsScreen() {
  const bars = [
    { month: "Jan", revenue: 55, cogs: 40 },
    { month: "Feb", revenue: 70, cogs: 52 },
    { month: "Mar", revenue: 48, cogs: 36 },
    { month: "Apr", revenue: 85, cogs: 62 },
    { month: "May", revenue: 72, cogs: 54 },
  ];
  return (
    <MobileChrome title="Analytics">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-1 p-1.5 shrink-0">
          {[
            { label: "Revenue", val: "₹4.8L", c: "text-blue-600" },
            { label: "COGS", val: "₹3.4L", c: "text-rose-600" },
            { label: "Profit", val: "₹1.4L", c: "text-emerald-600" },
          ].map(({ label, val, c }) => (
            <div key={label} className="bg-white rounded-lg p-1.5 shadow-sm text-center">
              <div className={`text-[6.5px] font-black ${c}`}>{val}</div>
              <div className="text-[5px] text-slate-400 font-bold uppercase mt-0.5">{label}</div>
            </div>
          ))}
        </div>
        {/* Bar chart */}
        <div className="flex-1 flex items-end gap-1.5 px-3 pb-1 pt-0.5">
          {bars.map(({ month, revenue, cogs }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex gap-0.5 items-end" style={{ height: 48 }}>
                <div className="flex-1 bg-blue-400 rounded-t-sm" style={{ height: `${revenue}%` }} />
                <div className="flex-1 bg-rose-300 rounded-t-sm" style={{ height: `${cogs}%` }} />
              </div>
              <span className="text-[5px] text-slate-400 font-medium">{month}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-3 justify-center pb-1 shrink-0">
          <div className="flex items-center gap-0.5">
            <div className="size-1.5 rounded-full bg-blue-400" />
            <span className="text-[5px] text-slate-500">Revenue</span>
          </div>
          <div className="flex items-center gap-0.5">
            <div className="size-1.5 rounded-full bg-rose-300" />
            <span className="text-[5px] text-slate-500">COGS</span>
          </div>
        </div>
      </div>
    </MobileChrome>
  );
}

function CustomersScreen() {
  return (
    <MobileChrome title="Customers">
      <div className="flex flex-col h-full">
        <div className="px-2 pt-1.5 pb-1 bg-white border-b border-slate-100 shrink-0">
          <div className="bg-slate-100 rounded-lg px-2 py-1 flex items-center gap-1.5">
            <div className="size-1.5 rounded-full border border-slate-400" />
            <span className="text-[6.5px] text-slate-400">Search customers…</span>
          </div>
        </div>
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-1">
          {[
            { name: "Ahmed Khan", phone: "+91 98765 43210", orders: 5, balance: "₹45,000", due: false },
            { name: "Priya Sharma", phone: "+91 87654 32109", orders: 3, balance: "₹32,500", due: true },
            { name: "Ravi Verma", phone: "+91 76543 21098", orders: 8, balance: "₹1,24,000", due: false },
            { name: "Ayesha Begum", phone: "+91 65432 10987", orders: 2, balance: "₹18,500", due: true },
          ].map(({ name, phone, orders, balance, due }) => (
            <div key={name} className="bg-white rounded-lg p-1.5 flex items-center gap-1.5 shadow-sm">
              <div className="size-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-black text-blue-600">{name[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[6.5px] font-bold text-slate-900">{name}</div>
                <div className="text-[5px] text-slate-400 truncate">{phone} · {orders} orders</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[6.5px] font-bold text-slate-900">{balance}</div>
                {due && <div className="text-[5px] text-rose-500 font-bold">Due</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

function CustomerDetailScreen() {
  return (
    <MobileChrome title="Customer Record" back>
      <div className="flex flex-col h-full overflow-hidden">
        {/* Profile header */}
        <div className="bg-white px-2.5 py-2 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="size-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-black text-blue-600">A</span>
            </div>
            <div>
              <div className="text-[7.5px] font-black text-slate-900">Ahmed Khan</div>
              <div className="text-[5.5px] text-slate-400">+91 98765 43210 · 5 orders</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: "Total Sales", val: "₹1.85L", c: "text-blue-600" },
              { label: "Amount Paid", val: "₹1.40L", c: "text-emerald-600" },
              { label: "Balance Due", val: "₹45,000", c: "text-rose-600" },
            ].map(({ label, val, c }) => (
              <div key={label} className="bg-slate-50 rounded-lg p-1 text-center border border-slate-100">
                <div className={`text-[6.5px] font-black ${c}`}>{val}</div>
                <div className="text-[4.5px] text-slate-400 font-bold uppercase mt-0.5 leading-tight">{label}</div>
              </div>
            ))}
          </div>
        </div>
        {/* Order history */}
        <div className="flex-1 overflow-hidden p-1.5 flex flex-col gap-0.5">
          <div className="text-[5.5px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Order History</div>
          {[
            { id: "SO-118", date: "20 May", amount: "₹45,000", status: "Paid" },
            { id: "SO-112", date: "05 May", amount: "₹89,000", status: "Partial" },
            { id: "SO-104", date: "22 Apr", amount: "₹51,000", status: "Paid" },
          ].map(({ id, date, amount, status }) => (
            <div key={id} className="bg-white rounded-lg px-2 py-1.5 flex items-center justify-between shadow-sm">
              <div>
                <div className="text-[6.5px] font-bold text-emerald-700">{id}</div>
                <div className="text-[5px] text-slate-400">{date}</div>
              </div>
              <div className="flex items-center gap-1">
                <div className="text-[6.5px] font-bold text-slate-900">{amount}</div>
                <span className={`text-[5px] font-bold px-1 py-0.5 rounded-full ${
                  status === "Paid" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}>{status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileChrome>
  );
}

// ─── Slide Definitions ───────────────────────────────────────────────────────

const FEATURES = [
  {
    id: "sidebar",
    icon: PanelLeft,
    color: "text-slate-700 bg-slate-100",
    title: "Easy Navigation",
    description:
      "Everything is one tap away. On desktop use the sidebar; on mobile tap the menu icon to reach any section instantly.",
    Screen: SidebarScreen,
  },
  {
    id: "dashboard",
    icon: LayoutDashboard,
    color: "text-blue-600 bg-blue-50",
    title: "Dashboard",
    description:
      "Net cash flow, purchase totals, sales revenue, and live stock value — all updated automatically as you log activity.",
    Screen: DashboardScreen,
  },
  {
    id: "inventory",
    icon: Smartphone,
    color: "text-primary-600 bg-primary-50",
    title: "Inventory",
    description:
      "Every device tracked by IMEI. Filter by Pending, In Stock, or Sold. Tap any item to edit details or view history.",
    Screen: InventoryScreen,
  },
  {
    id: "purchase-orders",
    icon: ShoppingCart,
    color: "text-rose-600 bg-rose-50",
    title: "Purchase Orders",
    description:
      "Record stock purchases with supplier name, device list, and IMEI entries. Certify once the stock is received and verified.",
    Screen: PurchaseOrdersScreen,
  },
  {
    id: "order-details",
    icon: Package,
    color: "text-amber-600 bg-amber-50",
    title: "Order Details",
    description:
      "Drill into any PO or SO — see every device, quantity, IMEI, and a full payment breakdown with what's paid vs. due.",
    Screen: OrderDetailsScreen,
  },
  {
    id: "sales-orders",
    icon: FileText,
    color: "text-emerald-600 bg-emerald-50",
    title: "Sales Orders",
    description:
      "Create customer invoices by picking devices from inventory. Set payment terms and track partial payments and dues.",
    Screen: SalesOrdersScreen,
  },
  {
    id: "ledger",
    icon: Banknote,
    color: "text-indigo-600 bg-indigo-50",
    title: "Accounts Ledger",
    description:
      "Live balance, every rupee in and out. Purchases, sales, and refunds reflected instantly with per-party statements.",
    Screen: LedgerScreen,
  },
  {
    id: "analytics",
    icon: TrendingUp,
    color: "text-violet-600 bg-violet-50",
    title: "Analytics",
    description:
      "Revenue vs. COGS bar charts, profit margins, and monthly trends. See exactly where your money is coming and going.",
    Screen: AnalyticsScreen,
  },
  {
    id: "customers",
    icon: Users,
    color: "text-cyan-600 bg-cyan-50",
    title: "Customers",
    description:
      "Full customer directory with purchase history, outstanding dues, and contact info. Search and filter in seconds.",
    Screen: CustomersScreen,
  },
  {
    id: "customer-detail",
    icon: UserCircle,
    color: "text-pink-600 bg-pink-50",
    title: "Customer Details",
    description:
      "Lifetime value, all orders, payment status, and balance due — the full picture of every customer relationship.",
    Screen: CustomerDetailScreen,
  },
] as const;

// ─── Slide animation variants ────────────────────────────────────────────────

const SLIDE_VARIANTS = {
  enter: (d: number) => ({ x: d > 0 ? 80 : -80, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -80 : 80, opacity: 0 }),
};

const TEXT_VARIANTS = {
  enter: (d: number) => ({ x: d > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? -24 : 24, opacity: 0 }),
};

const ANIM = { duration: 0.2, ease: "easeOut" as const };

// ─── Main Component ──────────────────────────────────────────────────────────

export default function FeatureTour() {
  const { onboardingCompletedAt } = useAuth();
  const location = useLocation();
  const [visible, setVisible] = useState(false);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  useEffect(() => {
    if (
      onboardingCompletedAt !== undefined &&
      location.pathname === "/" &&
      localStorage.getItem(FEATURE_TOUR_KEY) !== "true"
    ) {
      setVisible(true);
    }
  }, [onboardingCompletedAt, location.pathname]);

  const dismiss = (completed = false) => {
    localStorage.setItem(FEATURE_TOUR_KEY, "true");
    setVisible(false);
    posthog.capture("onboarding.feature_tour_dismissed", {
      completed,
      stepsViewed: idx + 1,
      totalSteps: FEATURES.length,
    });
  };

  const goTo = (newIdx: number) => {
    setDir(newIdx > idx ? 1 : -1);
    setIdx(newIdx);
  };

  const next = () => {
    if (idx === FEATURES.length - 1) {
      dismiss(true);
      return;
    }
    goTo(idx + 1);
  };

  const prev = () => {
    if (idx > 0) goTo(idx - 1);
  };

  if (!visible) return null;

  const feature = FEATURES[idx];
  const Icon = feature.icon;
  const Screen = feature.Screen;
  const isLast = idx === FEATURES.length - 1;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="ft-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-end md:items-center md:justify-center"
        onClick={() => dismiss(false)}
      >
        {/* Sheet / Dialog */}
        <motion.div
          key="ft-panel"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="w-full md:w-[400px] bg-white dark:bg-slate-900 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── Phone mockup area ── */}
          <div className="relative bg-slate-950 pt-3 pb-2 px-8">
            {/* Close */}
            <button
              onClick={() => dismiss(false)}
              className="absolute top-3 right-3 size-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
              aria-label="Close tour"
            >
              <X size={12} />
            </button>
            {/* Pill notch */}
            <div className="w-16 h-1 bg-slate-800 rounded-full mx-auto mb-2" />
            {/* Screen */}
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.div
                key={feature.id + "_screen"}
                custom={dir}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ANIM}
                className="h-[185px] rounded-xl overflow-hidden bg-white"
              >
                <Screen />
              </motion.div>
            </AnimatePresence>
            {/* Home bar */}
            <div className="w-20 h-0.5 bg-slate-800 rounded-full mx-auto mt-2" />
          </div>

          {/* ── Content area ── */}
          <div className="px-5 pt-4 pb-5">
            <AnimatePresence mode="popLayout" custom={dir}>
              <motion.div
                key={feature.id + "_text"}
                custom={dir}
                variants={TEXT_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={ANIM}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${feature.color}`}>
                    <Icon size={18} />
                  </div>
                  <h3 className="text-[15px] font-black text-slate-900 dark:text-slate-100">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* ── Dot pagination ── */}
            <div className="flex items-center justify-center gap-1 mt-4 mb-4">
              {FEATURES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => goTo(i)}
                  className={`rounded-full transition-all duration-200 ${
                    i === idx
                      ? "w-5 h-1.5 bg-primary-500"
                      : "size-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300"
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            {/* ── Navigation ── */}
            <div className="flex items-center justify-between gap-3">
              {idx > 0 ? (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              ) : (
                <button
                  onClick={() => dismiss(false)}
                  className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors font-medium"
                >
                  Skip tour
                </button>
              )}

              <button
                onClick={next}
                className="flex items-center gap-1.5 text-sm px-5 py-2 bg-primary-500 hover:bg-primary-600 active:scale-95 text-white font-bold rounded-xl transition-all"
              >
                {isLast ? (
                  <>Let&apos;s go! <Check size={14} /></>
                ) : (
                  <>Next <ArrowRight size={14} /></>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
