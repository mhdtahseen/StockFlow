import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/bottom-sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Check } from 'lucide-react';
import { useAppSelector } from '@/app/hooks';
import { Phone } from '@/features/inventory/types';
import clsx from 'clsx';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  onSelect: (phones: Phone[]) => void;
}

export function DeviceSelectorSheet({ open, onOpenChange, selectedIds, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const phones = useAppSelector(state => state.inventory.phones).filter((p: Phone) => p.status === 'IN_STOCK');
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set(selectedIds));

  React.useEffect(() => {
    if (open) setDraftIds(new Set(selectedIds));
  }, [open, selectedIds]);

  const filtered = useMemo(() => {
    if (!query) return phones;
    const q = query.toLowerCase();
    return phones.filter((p: Phone) => 
      p.brand.toLowerCase().includes(q) || 
      p.model.toLowerCase().includes(q) ||
      p.imeis?.[0]?.toLowerCase().includes(q)
    );
  }, [query, phones]);

  const toggle = (id: string) => {
    const next = new Set(draftIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setDraftIds(next);
  };
  
  const toggleAll = () => {
    if (draftIds.size === filtered.length) setDraftIds(new Set());
    else setDraftIds(new Set(filtered.map(f => f.id)));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[90vh] flex flex-col p-4 sm:p-6 rounded-t-3xl border-t border-slate-200 dark:border-slate-800">
        <SheetHeader className="mb-4 flex flex-row items-center justify-between">
          <SheetTitle>Select Inventory</SheetTitle>
          <button onClick={toggleAll} className="text-sm text-primary-500 dark:text-blue-400 font-bold active:scale-95 transition-transform">
            {draftIds.size === filtered.length ? 'Clear All' : 'Select All'}
          </button>
        </SheetHeader>
        
        <div className="relative mb-4 shrink-0">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search brand, model, IMEI..." 
            value={query} onChange={e => setQuery(e.target.value)}
            className="pl-10 h-12 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl font-medium"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pb-6">
          {filtered.map((p: Phone) => {
            const isSelected = draftIds.has(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={clsx(
                  "w-full text-left p-4 rounded-xl flex items-center gap-4 transition-colors border",
                  isSelected 
                    ? "bg-blue-50/80 border-primary-500/30 dark:bg-primary-500/20 dark:border-primary-500/50" 
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary-500/30"
                )}
              >
                <div className={clsx(
                  "size-6 rounded-md border flex items-center justify-center transition-colors shrink-0",
                  isSelected ? "bg-primary-500 border-primary-500 text-white" : "border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-950"
                )}>
                  {isSelected && <Check size={14} strokeWidth={3.5} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-900 dark:text-slate-100 truncate">{p.brand} {p.model}</div>
                  <div className="text-xs font-semibold text-slate-500 mt-0.5 truncate uppercase tracking-wide">
                    {p.storage} • {p.color} • IMEI: ****{p.imeis?.[0]?.slice(-4) || 'N/A'}
                  </div>
                </div>
                <div className="font-black text-primary-500 dark:text-blue-400 shrink-0">
                  ₹{(p.salePrice || 0).toLocaleString()}
                </div>
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-10">
               <span className="text-slate-500 font-medium block">No available inventory</span>
               <span className="text-sm text-slate-400">Ensure the devices are in "IN STOCK" status.</span>
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
          <Button 
            onClick={() => {
              const selectedPhones = phones.filter((p: Phone) => draftIds.has(p.id));
              onSelect(selectedPhones);
              onOpenChange(false);
            }} 
            className="w-full h-14 rounded-xl text-lg font-bold bg-primary-500 hover:bg-blue-800 text-white shadow-lg shadow-primary-500/20"
          >
            Confirm {draftIds.size} {draftIds.size === 1 ? 'Device' : 'Devices'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
