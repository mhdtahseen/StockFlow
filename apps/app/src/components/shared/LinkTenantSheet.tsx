import React, { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAppDispatch } from "@/app/hooks";
import { updateCustomerLink } from "@/features/customers/slice";
import { linkCounterpartyToTenant, unlinkCounterparty } from "@/app/supabaseApi";
import { toast } from "sonner";
import { Building2, Link2, Link2Off, CheckCircle2, Search } from "lucide-react";
import clsx from "clsx";
import type { Customer } from "@/features/customers/types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer;
}

export function LinkTenantSheet({ open, onOpenChange, customer }: Props) {
  const dispatch = useAppDispatch();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const isLinked = Boolean(customer.linkedTenantId);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || busy) return;
    setBusy(true);
    try {
      const result = await linkCounterpartyToTenant(customer.id, code);
      dispatch(updateCustomerLink({
        id: customer.id,
        linkedTenantId: result.tenant_id,
        linkedTenantName: result.tenant_name,
      }));
      toast.success(`Linked to "${result.tenant_name}"`);
      setCode("");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to link business");
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await unlinkCounterparty(customer.id);
      dispatch(updateCustomerLink({
        id: customer.id,
        linkedTenantId: undefined,
        linkedTenantName: undefined,
      }));
      toast.success("Business link removed");
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to unlink");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-0 pt-0 pb-safe-bottom"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="size-10 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Building2 size={20} />
          </div>
          <div>
            <SheetTitle className="text-base font-black text-slate-900 dark:text-white leading-tight">
              Trade Network
            </SheetTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">{customer.name}</p>
          </div>
        </div>

        <div className="px-6 pt-5 pb-6 space-y-5">
          {isLinked ? (
            /* ── Already linked ── */
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-4 flex items-center gap-3">
                <div className="size-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-0.5">
                    Verified StockFlow Business
                  </p>
                  <p className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {customer.linkedTenantName ?? "Linked Business"}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Sale orders created for <strong>{customer.name}</strong> will automatically generate a Purchase Order on their StockFlow account.
              </p>

              <Button
                type="button"
                variant="outline"
                onClick={handleUnlink}
                disabled={busy}
                className="w-full h-12 rounded-2xl border-rose-200 dark:border-rose-800 text-rose-500 dark:text-rose-400 font-black text-sm gap-2"
              >
                <Link2Off size={16} />
                {busy ? "Removing…" : "Remove Link"}
              </Button>
            </div>
          ) : (
            /* ── Link form ── */
            <form onSubmit={handleLink} className="space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 space-y-1">
                <p className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                  What is a Trade Code?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Every StockFlow business has a unique 6-character Trade Code visible in their Settings. Ask your contact to share it with you.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 block mb-2.5">
                  Enter Trade Code
                </label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                  placeholder="E.G. AB3X7K"
                  maxLength={6}
                  autoCapitalize="characters"
                  className={clsx(
                    "h-14 text-2xl font-black tracking-[0.25em] text-center rounded-2xl uppercase",
                    "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700",
                  )}
                />
                {code.length > 0 && code.length < 6 && (
                  <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                    {6 - code.length} more character{6 - code.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={code.length < 6 || busy}
                className="w-full h-14 rounded-2xl bg-violet-500 hover:bg-violet-600 text-white font-black text-base shadow-lg shadow-violet-500/25 gap-2"
              >
                <Link2 size={18} />
                {busy ? "Verifying…" : "Link Business"}
              </Button>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
