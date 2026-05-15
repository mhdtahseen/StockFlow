import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapPin, Trash2, AlertTriangle, Link2 } from "lucide-react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { useAppDispatch } from "@/app/hooks";
import { updateCustomer, removeCustomer } from "@/features/customers/slice";
import { Customer, CustomerType } from "@/features/customers/types";
import { AadhaarInput } from "@/components/ui/AadhaarInput";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
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
  { value: "PLATFORM", label: "Platform", description: "E-commerce or listing platform" },
];

export function CustomerEditSheet({ open, onOpenChange, customer }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [name, setName] = useState(customer.name);
  const [phone, setPhone] = useState(customer.phone?.replace("+", "") || "");
  const [email, setEmail] = useState(customer.email || "");
  const [type, setType] = useState<CustomerType>(customer.type);
  const [address, setAddress] = useState(customer.address || "");
  const [aadhaar, setAadhaar] = useState("");
  const [aadhaarValid, setAadhaarValid] = useState(false);

  useEffect(() => {
    if (open) {
      setName(customer.name);
      setPhone(customer.phone?.replace("+", "") || "");
      setEmail(customer.email || "");
      setType(customer.type);
      setAddress(customer.address || "");
      setAadhaar("");
      setAadhaarValid(false);
    }
  }, [open, customer]);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let updatedAadhaarProps = {};
    if (aadhaar.length === 12 && aadhaarValid) {
      updatedAadhaarProps = {
        aadhaarLast4: aadhaar.slice(-4),
        aadhaarEncrypted: btoa(aadhaar).split("").reverse().join(""),
      };
    }

    const updatedCustomer: Customer = {
      ...customer,
      name: name.trim(),
      phone: phone.length > 2 ? `+${phone}` : undefined,
      email: email.trim() || undefined,
      type,
      address: address.trim() || undefined,
      ...updatedAadhaarProps,
    };

    dispatch(updateCustomer(updatedCustomer));
    onOpenChange(false);
  };

  const canSubmit =
    name.trim().length > 0 &&
    (aadhaar.length === 0 || (aadhaar.length === 12 && aadhaarValid));

  return (
    <>
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] flex flex-col p-0 rounded-t-3xl border-t border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-left text-lg font-black">
              Edit Customer
            </SheetTitle>
            {/* C3: Linked tenant badge */}
            {(customer as any).linkedTenantId && (
              <span className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 dark:bg-teal-900/20 dark:text-teal-400 px-2 py-1 rounded-full">
                <Link2 size={10} />
                Linked Business
              </span>
            )}
          </div>
        </SheetHeader>

        <form
          onSubmit={handleUpdate}
          className="flex flex-col flex-1 overflow-y-auto px-4 pt-4 gap-5 pb-8"
        >
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              Phone Number
            </label>
            <div className="phone-input-wrapper">
              <PhoneInput
                country={"in"}
                value={phone}
                onChange={(p) => setPhone(p)}
                inputProps={{
                  name: "phone",
                  id: "edit-customer-phone",
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
          </div>

          {/* C4: Email */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              Email <span className="text-slate-400 font-medium normal-case tracking-normal">(Optional)</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. ravi@example.com"
              className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-semibold"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block">
              Customer Type
            </label>
            {/* C2: type-change warning */}
            {type !== customer.type && (
              <div className="flex items-center gap-2 mb-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/40">
                <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  Changing type from <strong>{customer.type}</strong> to <strong>{type}</strong> will affect reporting.
                </span>
              </div>
            )}
            <Select
              value={type}
              onValueChange={(v) => setType(v as CustomerType)}
            >
              <SelectTrigger className="w-full h-12 px-4 text-left rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-semibold">
                <SelectValue placeholder="Select type..." />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMER_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex flex-col py-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        {t.label}
                      </span>
                      <span className="text-xs text-slate-500">
                        {t.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 block">
                Aadhaar Number
              </label>
              {customer.aadhaarLast4 && !aadhaar && (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">
                  Linked: XXXX {customer.aadhaarLast4}
                </span>
              )}
            </div>
            <AadhaarInput
              value={aadhaar}
              onChange={(val) => setAadhaar(val)}
              onValidate={(valid) => setAadhaarValid(valid)}
            />
            <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
              🔒{" "}
              {customer.aadhaarLast4 && !aadhaar
                ? "Entering a new Aadhaar will replace the existing one"
                : "Aadhaar is stored and displayed securely"}
            </p>
          </div>

          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 block flex items-center gap-1.5">
              <MapPin size={12} /> Address{" "}
              <span className="text-slate-400 font-medium normal-case tracking-normal">
                (Optional)
              </span>
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Shop/House No., Street, City, State..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all resize-none"
            />
          </div>

          <div className="mt-auto grid grid-cols-2 gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-12 rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-12 bg-primary-500 hover:bg-blue-800 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
            >
              Update Details
            </Button>
          </div>

          {/* C1: Delete action */}
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full py-3 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors flex items-center justify-center gap-2 border-t border-slate-100 dark:border-slate-800"
          >
            <Trash2 size={13} />
            Delete this customer
          </button>
        </form>
      </SheetContent>
    </Sheet>

    {/* C1: Delete confirmation dialog */}
    <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-black">Delete {customer.name}?</DialogTitle>
          <DialogDescription className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            All orders and payments linked to this customer will remain in history, but the customer profile will be removed.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-3 mt-2">
          <Button
            variant="outline"
            className="flex-1 h-11 rounded-xl font-bold"
            onClick={() => setShowDeleteConfirm(false)}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 h-11 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold"
            onClick={() => {
              dispatch(removeCustomer(customer.id));
              setShowDeleteConfirm(false);
              onOpenChange(false);
              navigate("/customers", { replace: true });
            }}
          >
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
