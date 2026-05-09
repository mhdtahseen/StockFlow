import React, { useState } from "react";
import { Download, X } from "lucide-react";
import { useAppSelector } from "../../app/hooks";
import { selectLedgerEntries } from "../../features/wallet/selectors";
import { generateExport } from "../../utils/export";
import { toast } from "sonner";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ExportModal({ isOpen, onClose }: ExportModalProps) {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">(
    "monthly",
  );

  const phones = useAppSelector((state) => state.inventory.phones);
  const ledgerEntries = useAppSelector(selectLedgerEntries);

  if (!isOpen) return null;

  const handleExport = () => {
    try {
      generateExport(phones, ledgerEntries, period);
      toast.success("Export Complete", {
        description: "Your spreadsheet download should begin immediately.",
      });
      onClose();
    } catch (error: any) {
      console.error(error);
      toast.error("Export Failed", {
        description:
          error?.message ||
          "An unexpected error occurred building the spreadsheet.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity">
      <div className="bg-white dark:bg-slate-900 w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-5 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-primary-500 dark:text-blue-400">
              <Download size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Export Data
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Download your Excel spreadsheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Cashflow Period
            </label>
            <p className="text-xs text-slate-500 pb-2">
              How do you want to group your cashflow summary?
            </p>
            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
              {["daily", "weekly", "monthly"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as any)}
                  className={`flex-1 py-2 text-xs font-bold capitalize rounded-lg transition-colors ${period === p ? "bg-white dark:bg-slate-900 text-primary-500 dark:text-blue-400 shadow-sm" : "text-slate-500 hover:bg-slate-200/50 dark:hover:bg-slate-700/50"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleExport}
          className="w-full bg-primary-500 hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] shadow-md shadow-blue-900/20"
        >
          Generate .xlsx File
        </button>
      </div>
    </div>
  );
}
