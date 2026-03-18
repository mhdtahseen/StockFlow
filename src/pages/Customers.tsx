import React, { useState } from 'react';
import { useAppSelector } from '@/app/hooks';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import { Search, Users, ChevronRight } from 'lucide-react';

export default function Customers() {
  const { customers } = useAppSelector((state) => state.customers);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const fuse = new Fuse(customers, {
    keys: ['name', 'phone'],
    threshold: 0.3,
  });

  const filtered = search.trim() ? fuse.search(search).map(r => r.item) : customers;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">
      <header className="px-4 pt-[calc(1rem+env(safe-area-inset-top,0px))] pb-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 sticky top-0 z-10">
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          <Users className="text-[#064a98]" size={24} />
          Directory
        </h1>
        <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{customers.length} Contacts</p>
      </header>

      <div className="p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-10 pr-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm font-semibold shadow-sm focus:border-[#064a98] outline-none transition-colors"
          />
        </div>

        <div className="space-y-3 pb-24">
          {filtered.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
               <p className="text-slate-500 font-semibold mb-2">No customers found.</p>
               <p className="text-xs text-slate-400 font-medium">Create trade orders to add customers to the directory automatically.</p>
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/customers/${c.id}`)}
                className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:border-[#064a98]/30 active:scale-[0.98] transition-all group"
              >
                <div className="size-12 rounded-full bg-blue-50 dark:bg-blue-900/20 text-[#064a98] dark:text-blue-400 flex items-center justify-center font-black text-lg shrink-0">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 truncate">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                      {c.type}
                    </span>
                    {c.phone && <span className="text-xs font-medium text-slate-500 truncate">{c.phone}</span>}
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 group-hover:text-[#064a98] transition-colors shrink-0" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
