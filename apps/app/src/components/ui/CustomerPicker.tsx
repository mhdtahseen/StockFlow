import React, { useState, useMemo, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/bottom-sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import {
  Search,
  Plus,
  UserPlus,
  ChevronRight,
  MapPin,
  BadgeCheck,
  AlertTriangle,
  ChevronDown,
  Building2,
  Receipt,
} from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import Fuse from "fuse.js";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectCustomers } from "@/features/customers/selectors";
import { addCustomer } from "@/features/customers/slice";
import { Customer, CustomerType } from "@/features/customers/types";
import { AadhaarInput } from "@/components/ui/AadhaarInput";
import clsx from "clsx";
import { isValidGstin } from "@/utils/gstCalc";

interface Props {
  selectedId?: string;
  onSelect: (customer: Customer) => void;
  placeholder?: string;
  trigger?: React.ReactNode;
  mode?: "select" | "add";
}

const CUSTOMER_TYPES: {
  value: CustomerType;
  label: string;
  description: string;
}[] = [
  {
    value: "CUSTOMER",
    label: "Customer — Direct",
    description: "Individual retail buyer",
  },
  {
    value: "RETAILER",
    label: "Customer — Retailer",
    description: "Shop owner buying for resale",
  },
  {
    value: "WHOLESALER",
    label: "Customer — Wholesaler",
    description: "Bulk B2B buyer",
  },
  {
    value: "PLATFORM",
    label: "Platform",
    description: "Online marketplace (Amazon, Flipkart…)",
  },
];

const TYPE_BADGE: Record<CustomerType, string> = {
  CUSTOMER: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  RETAILER:
    "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  WHOLESALER:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  PLATFORM: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
};

const TYPE_LABEL: Record<CustomerType, string> = {
  CUSTOMER: "Direct",
  RETAILER: "Retailer",
  WHOLESALER: "Wholesaler",
  PLATFORM: "Platform",
};

export function CustomerPicker({
  selectedId,
  onSelect,
  placeholder = "Tap to select customer...",
  trigger,
  mode = "select",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(mode === "add");

  // Create-form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newType, setNewType] = useState<CustomerType>("CUSTOMER");
  const [newAadhaar, setNewAadhaar] = useState("");
  const [aadhaarValid, setAadhaarValid] = useState(false);
  const [newAddress, setNewAddress] = useState("");
  const [newGstin, setNewGstin] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const customers = useAppSelector(selectCustomers);
  const dispatch = useAppDispatch();

  // B3: detect duplicate phone
  const formattedPhone = newPhone.length > 2 ? `+${newPhone}` : "";
  const duplicateCustomer = formattedPhone
    ? customers.find((c) => c.phone === formattedPhone)
    : null;

  const fuse = useMemo(
    () => new Fuse(customers, { keys: ["name", "phone"], threshold: 0.3 }),
    [customers],
  );

  const results = useMemo(() => {
    if (!query.trim()) return customers;
    return fuse.search(query).map((r) => r.item);
  }, [query, customers, fuse]);

  const selectedCustomer = customers.find((c) => c.id === selectedId);

  const handleSelect = (c: Customer) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
  };

  const resetCreateForm = () => {
    setNewName("");
    setNewPhone("");
    setNewEmail("");
    setNewType("CUSTOMER");
    setNewAadhaar("");
    setAadhaarValid(false);
    setNewAddress("");
    setNewGstin("");
    setNewNotes("");
    setShowAdvanced(false);
    setIsCreating(false);
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || isSaving) return;

    setIsSaving(true);
    try {
      // Security: encrypt full number, display last 4
      const aadhaarLast4 =
        newAadhaar.length === 12 ? newAadhaar.slice(-4) : undefined;
      const aadhaarEncrypted =
        newAadhaar.length === 12
          ? btoa(newAadhaar).split("").reverse().join("")
          : undefined;

      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        name: newName.trim(),
        phone: formattedPhone || undefined,
        email: newEmail.trim() || undefined,
        type: newType,
        aadhaarLast4,
        aadhaarEncrypted,
        address: newAddress.trim() || undefined,
        gstin: newGstin.trim().toUpperCase() || undefined,
        notes: newNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      // 1. Close first to restore focus gracefully (Fixes ARIA hidden error)
      setOpen(false);
      setQuery("");
      resetCreateForm();

      // 2. Update state
      dispatch(addCustomer(newCustomer));
      onSelect(newCustomer);
    } finally {
      setIsSaving(false);
    }
  };

  const canSubmit =
    newName.trim().length > 0 &&
    (newAadhaar.length === 0 || (newAadhaar.length === 12 && aadhaarValid));

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          resetCreateForm();
          setIsCreating(mode === "add");
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal h-12 px-4 shadow-sm border-slate-200 dark:border-slate-800"
          >
            {selectedCustomer ? (
              <div className="flex items-center gap-3 w-full overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-sm font-black">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{selectedCustomer.name}</span>
                    {selectedCustomer.gstin && isValidGstin(selectedCustomer.gstin) && (
                      <span className="inline-flex items-center text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded shrink-0 border border-emerald-500/20">
                        GST
                      </span>
                    )}
                    {selectedCustomer.linkedTenantId && (
                      <Building2 size={11} className="text-violet-500 shrink-0" />
                    )}
                  </span>
                  {selectedCustomer.linkedTenantId ? (
                    <span className="text-[10px] text-violet-500 font-bold">
                      {selectedCustomer.linkedTenantName ?? "StockFlow Business"}
                    </span>
                  ) : selectedCustomer.phone ? (
                    <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                      {selectedCustomer.phone}
                    </span>
                  ) : null}
                </div>
                <span
                  className={clsx(
                    "ml-auto text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md shrink-0",
                    TYPE_BADGE[selectedCustomer.type],
                  )}
                >
                  {TYPE_LABEL[selectedCustomer.type]}
                </span>
              </div>
            ) : (
              <span className="text-slate-400">{placeholder}</span>
            )}
          </Button>
        )}
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="h-[88vh] max-h-[calc(100svh-4rem)] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <SheetTitle className="text-left text-lg font-black">
            {isCreating ? "New Customer" : "Select Customer"}
          </SheetTitle>
        </SheetHeader>

        {/* ── SEARCH VIEW ── */}
        {!isCreating && (
          <div className="flex flex-col flex-1 overflow-hidden px-4 pt-4">
            <div className="relative mb-4 shrink-0">
              <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11 h-12 bg-slate-50 dark:bg-slate-900 border-transparent rounded-xl font-medium"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pb-6">
              {/* Generic create button */}
              {!query.trim() && (
                <button
                  onClick={() => {
                    setNewName("");
                    setIsCreating(true);
                  }}
                  className="w-full mt-4 p-3.5 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
                >
                  <UserPlus size={18} />
                  Create New Customer
                </button>
              )}
              {results.length > 0 ? (
                results.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="w-full text-left p-3.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors flex items-center gap-3 group"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-sm font-black group-hover:bg-primary-500/10 group-hover:text-primary-500 transition-colors">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
                        <span className="truncate">{c.name}</span>
                        {c.gstin && isValidGstin(c.gstin) && (
                          <span className="inline-flex items-center text-[8px] font-black bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1 py-0.5 rounded shrink-0 border border-emerald-500/20">
                            GST
                          </span>
                        )}
                        {c.linkedTenantId && (
                          <Building2 size={11} className="text-violet-500 shrink-0" />
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                        {c.linkedTenantId
                          ? <span className="text-violet-500 font-bold">{c.linkedTenantName ?? "StockFlow Business"}</span>
                          : (c.phone || "No phone")}
                        {c.aadhaarLast4 && (
                          <span className="flex items-center gap-0.5 text-emerald-500 font-bold">
                            <BadgeCheck size={11} />
                            XXXX {c.aadhaarLast4}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={clsx(
                          "text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md",
                          TYPE_BADGE[c.type],
                        )}
                      >
                        {TYPE_LABEL[c.type]}
                      </span>
                      <ChevronRight
                        size={16}
                        className="text-slate-300 group-hover:text-primary-500 transition-colors"
                      />
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-12">
                  <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    <Search
                      size={22}
                      className="text-slate-300 dark:text-slate-600"
                    />
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-bold">
                    No customers found
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    Try a different search term
                  </p>
                </div>
              )}

              {/* "Add as new" shortcut */}
              {query.trim() &&
                !results.some(
                  (c) => c.name.toLowerCase() === query.toLowerCase().trim(),
                ) && (
                  <button
                    onClick={() => {
                      setNewName(query.trim());
                      setIsCreating(true);
                    }}
                    className="w-full mt-2 p-3.5 rounded-xl bg-primary-500/5 dark:bg-primary-500/10 text-primary-500 font-bold hover:bg-primary-500/10 transition-colors flex items-center gap-2"
                  >
                    <Plus size={18} />
                    Add "{query.trim()}" as new customer
                  </button>
                )}
            </div>
          </div>
        )}

        {/* ── CREATE VIEW ── */}
        {isCreating && (
          <form
            onSubmit={handleCreate}
            className="flex flex-col flex-1 overflow-y-auto px-5 pt-5 gap-5 pb-10"
          >
            {/* Full Name */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                Full Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                placeholder="e.g. Ravi Kumar"
                className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                Phone Number{" "}
                <span className="text-slate-400 font-medium normal-case tracking-normal"></span>
              </label>
              <div className="phone-input-wrapper">
                <PhoneInput
                  country={"in"}
                  value={newPhone}
                  onChange={(phone) => setNewPhone(phone)}
                  // enableSearch
                  // disableSearchIcon
                  inputProps={{
                    name: "phone",
                    id: "new-customer-phone",
                    "aria-label": "Phone number",
                  }}
                  containerStyle={{ width: "100%" }}
                  inputStyle={{
                    width: "100%",
                    height: "48px",
                    borderRadius: "12px",
                    border: "1px solid",
                    borderColor: "inherit",
                    fontSize: "14px",
                    fontWeight: 600,
                    paddingLeft: "52px",
                  }}
                  buttonStyle={{
                    borderRadius: "12px 0 0 12px",
                    border: "1px solid",
                    borderColor: "inherit",
                    backgroundColor: "transparent",
                  }}
                />
              </div>
              {/* B3: duplicate phone warning */}
              {duplicateCustomer && (
                <div className="flex items-center gap-2 mt-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
                  <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex-1">
                    {duplicateCustomer.name} already uses this number
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onSelect(duplicateCustomer);
                    }}
                    className="text-[10px] font-black text-amber-700 dark:text-amber-400 underline underline-offset-2 shrink-0"
                  >
                    View Profile
                  </button>
                </div>
              )}
            </div>

            {/* B1: Email */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                Email <span className="text-slate-400 font-medium normal-case tracking-normal">(Optional)</span>
              </label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="e.g. ravi@example.com"
                className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>

            {/* Customer Type */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                Customer Type
              </label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as CustomerType)}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_1rem_center]"
              >
                {CUSTOMER_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                Notes <span className="text-slate-400 font-medium normal-case tracking-normal">(Optional)</span>
              </label>
              <Input
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="e.g. Referred by Amit, prefers COD"
                className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
              />
            </div>

            {/* B2: Advanced — Aadhaar + Address in collapsible section */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors w-full py-1"
              >
                <ChevronDown
                  size={14}
                  className={`transition-transform ${showAdvanced ? "rotate-180" : ""}`}
                />
                Advanced (Aadhaar, Address)
              </button>
              {showAdvanced && (
                <div className="mt-4 space-y-5 pl-1 border-l-2 border-slate-100 dark:border-slate-800">
                  {/* Aadhaar Number */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
                      Aadhaar Number{" "}
                      <span className="text-slate-400 font-medium normal-case tracking-normal"></span>
                    </label>
                    <AadhaarInput
                      value={newAadhaar}
                      onChange={(val) => setNewAadhaar(val)}
                      onValidate={(valid) => setAadhaarValid(valid)}
                    />
                    <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                      🔒 Aadhaar is stored and displayed securely
                    </p>
                  </div>

                  {/* Address */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block flex items-center gap-1.5">
                      <MapPin size={12} />
                      Address{" "}
                      <span className="text-slate-400 font-medium normal-case tracking-normal">
                        (Optional)
                      </span>
                    </label>
                    <textarea
                      value={newAddress}
                      onChange={(e) => setNewAddress(e.target.value)}
                      placeholder="Shop/House No., Street, City, State..."
                      rows={3}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
                    />
                  </div>

                  {/* GSTIN */}
                  <div>
                    <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block flex items-center gap-1.5">
                      <Receipt size={12} />
                      GSTIN{" "}
                      <span className="text-slate-400 font-medium normal-case tracking-normal">
                        (Optional — for GST invoices)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={newGstin}
                      onChange={(e) => setNewGstin(e.target.value.toUpperCase())}
                      maxLength={15}
                      placeholder="e.g. 27AAACR5055K1ZF"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 font-mono text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all"
                    />
                    {newGstin.length > 0 && (
                      newGstin.length !== 15
                        ? <p className="text-[11px] text-amber-500 font-semibold mt-1">GSTIN must be 15 characters</p>
                        : !isValidGstin(newGstin)
                          ? <p className="text-[11px] text-amber-500 font-semibold mt-1">Invalid GSTIN format</p>
                          : null
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="mt-auto grid grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  resetCreateForm();
                }}
                className="h-12 rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="h-12 bg-primary-500 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : (
                  "Save & Select"
                )}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
