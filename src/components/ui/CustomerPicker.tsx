import React, { useState, useMemo } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus, UserPlus } from "lucide-react";
import Fuse from "fuse.js";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { selectCustomers } from "@/features/customers/selectors";
import { addCustomer } from "@/features/customers/slice";
import { Customer } from "@/features/customers/types";

interface Props {
  selectedId?: string;
  onSelect: (customer: Customer) => void;
}

export function CustomerPicker({ selectedId, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  
  // Create form state
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newType, setNewType] = useState<Customer["type"]>("CUSTOMER");

  const customers = useAppSelector(selectCustomers);
  const dispatch = useAppDispatch();

  const fuse = useMemo(() => new Fuse(customers, { keys: ["name", "phone"], threshold: 0.3 }), [customers]);
  
  const results = useMemo(() => {
    if (!query.trim()) return customers;
    return fuse.search(query).map(r => r.item);
  }, [query, customers, fuse]);

  const selectedCustomer = customers.find(c => c.id === selectedId);

  const handleSelect = (c: Customer) => {
    onSelect(c);
    setOpen(false);
    setQuery("");
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      phone: newPhone.trim() || undefined,
      type: newType,
      createdAt: new Date().toISOString(),
    };
    dispatch(addCustomer(newCustomer));
    onSelect(newCustomer);
    setOpen(false);
    setQuery("");
    setIsCreating(false);
    setNewName("");
    setNewPhone("");
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal h-12 px-4 shadow-sm border-slate-200 dark:border-slate-800">
          {selectedCustomer ? (
            <div className="flex flex-col items-start gap-0.5 w-full overflow-hidden">
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedCustomer.name}</span>
              {selectedCustomer.phone && <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{selectedCustomer.phone}</span>}
            </div>
          ) : (
            <span className="text-slate-500">Tap to select customer...</span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] flex flex-col p-4 sm:p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-800">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-left">{isCreating ? "New Customer" : "Select Customer"}</SheetTitle>
        </SheetHeader>

        {!isCreating && (
          <>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
              <Input
                placeholder="Search by name or phone..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-transparent focus-visible:ring-[#064a98] rounded-xl"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pb-6">
              {results.length > 0 ? (
                results.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelect(c)}
                    className="w-full text-left p-3 rounded-xl hover:bg-slate-50 active:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between group border border-transparent dark:border-slate-800 focus:outline-[#064a98]"
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</div>
                      <div className="text-sm text-slate-500 mt-0.5">{c.phone || "No phone added"}</div>
                    </div>
                    <div className="text-[10px] font-bold tracking-wider px-2 py-1 bg-slate-100 dark:bg-slate-900 rounded-md text-slate-600 dark:text-slate-400 capitalize">
                      {c.type.toLowerCase()}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10">
                  <span className="text-slate-500 block mb-2 font-medium">No customers found</span>
                  <span className="text-sm text-slate-400">Try adjusting your search criteria.</span>
                </div>
              )}
              
              {query.trim() && !results.some(c => c.name.toLowerCase() === query.toLowerCase().trim()) && (
                <button
                  onClick={() => {
                    setNewName(query.trim());
                    setIsCreating(true);
                  }}
                  className="w-full mt-2 p-3 rounded-xl bg-blue-50/50 dark:bg-[#064a98]/10 text-[#064a98] dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-[#064a98]/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={18} />
                  Add "{query.trim()}" as new
                </button>
              )}
              
              {!query.trim() && (
                 <button
                 onClick={() => {
                   setNewName("");
                   setIsCreating(true);
                 }}
                 className="w-full mt-4 p-3 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors flex items-center justify-center gap-2"
               >
                 <UserPlus size={18} />
                 Create New Customer
               </button>
              )}
            </div>
          </>
        )}

        {isCreating && (
          <form onSubmit={handleCreate} className="flex flex-col gap-4 flex-1">
             <div>
                <label className="text-sm font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Full Name</label>
                <Input value={newName} onChange={e => setNewName(e.target.value)} required placeholder="e.g. John Doe" className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl" />
             </div>
             <div>
                <label className="text-sm font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Phone Number (Optional)</label>
                <Input value={newPhone} onChange={e => setNewPhone(e.target.value)} type="tel" placeholder="+1..." className="h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl" />
             </div>
             <div>
                <label className="text-sm font-semibold mb-1.5 block text-slate-700 dark:text-slate-300">Customer Category</label>
                <select 
                  value={newType} 
                  onChange={e => setNewType(e.target.value as Customer["type"])}
                  className="w-full h-12 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#064a98] dark:border-slate-800 dark:bg-slate-900 dark:focus-visible:ring-blue-500 font-medium"
                >
                  <option value="RETAIL">Retail standard</option>
                  <option value="B2B">B2B Wholesaler</option>
                </select>
             </div>
             <div className="mt-auto grid grid-cols-2 gap-3 pt-6">
                <Button type="button" variant="outline" onClick={() => setIsCreating(false)} className="h-12 rounded-xl font-bold">Cancel</Button>
                <Button type="submit" className="h-12 bg-[#064a98] hover:bg-blue-800 text-white rounded-xl font-bold">Save & Select</Button>
             </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
