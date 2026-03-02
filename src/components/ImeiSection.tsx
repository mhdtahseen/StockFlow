import React, { useState, useCallback } from "react";
import clsx from "clsx";
import {
  ScanBarcode,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronDown,
  Fingerprint,
} from "lucide-react";
import {
  validateImei,
  sanitizeImei,
  CEIR_VERIFICATION_URL,
  type ImeiEntry,
  type ImeiStatus,
} from "../utils/validateImei";
import ImeiScannerModal from "./ImeiScannerModal";

// ─── Props ────────────────────────────────────────────────────────────────────

interface ImeiSectionProps {
  imeis: ImeiEntry[];
  onChange: (imeis: ImeiEntry[]) => void;
}

// ─── Status labels & colors ──────────────────────────────────────────────────

const STATUS_OPTIONS: { value: ImeiStatus; label: string }[] = [
  { value: "UNVERIFIED", label: "Unverified" },
  { value: "CLEAN", label: "Clean" },
  { value: "BLACKLISTED", label: "Blacklisted" },
  { value: "LOCKED", label: "Locked" },
  { value: "UNKNOWN", label: "Unknown" },
];

function getStatusStyle(status: ImeiStatus) {
  switch (status) {
    case "CLEAN":
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800";
    case "BLACKLISTED":
      return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800";
    case "LOCKED":
      return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800";
    case "UNKNOWN":
      return "text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
    default:
      return "text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700";
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImeiSection({ imeis, onChange }: ImeiSectionProps) {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanTarget, setScanTarget] = useState<number>(0); // Which IMEI slot to fill

  // ─── Add / Remove IMEI slots ──────────────────────────────────────────────

  const addImeiSlot = useCallback(() => {
    onChange([...imeis, { value: "", status: "UNVERIFIED" }]);
  }, [imeis, onChange]);

  const removeImeiSlot = useCallback(
    (index: number) => {
      onChange(imeis.filter((_, i) => i !== index));
    },
    [imeis, onChange],
  );

  // ─── Update IMEI value ────────────────────────────────────────────────────

  const updateImeiValue = useCallback(
    (index: number, raw: string) => {
      const cleaned = sanitizeImei(raw);
      const updated = [...imeis];
      updated[index] = { ...updated[index], value: cleaned };
      onChange(updated);
    },
    [imeis, onChange],
  );

  // ─── Update IMEI status ───────────────────────────────────────────────────

  const updateImeiStatus = useCallback(
    (index: number, status: ImeiStatus) => {
      const updated = [...imeis];
      updated[index] = { ...updated[index], status };
      onChange(updated);
    },
    [imeis, onChange],
  );

  // ─── Scanner callback ────────────────────────────────────────────────────

  const handleScan = useCallback(
    (scanned: string) => {
      updateImeiValue(scanTarget, scanned);
    },
    [scanTarget, updateImeiValue],
  );

  // ─── Duplicate detection ──────────────────────────────────────────────────

  const getDuplicateError = (index: number): string | null => {
    const val = imeis[index].value;
    if (!val || val.length < 15) return null;
    const isDuplicate = imeis.some(
      (entry, i) => i !== index && entry.value === val,
    );
    return isDuplicate ? "Duplicate IMEI" : null;
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] dark:shadow-black/20 border border-slate-100 dark:border-slate-800 space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Fingerprint className="text-[#064a98]" size={18} strokeWidth={2.5} />
          IMEI
        </h3>

        {/* IMEI Fields */}
        <div className="space-y-3">
          {imeis.map((entry, index) => {
            const error =
              entry.value.length > 0
                ? validateImei(entry.value) || getDuplicateError(index)
                : null;
            const isValid = entry.value.length === 15 && !error;

            return (
              <div key={index} className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  IMEI {index + 1}
                </label>

                <div className="flex gap-2 items-start">
                  {/* Input + validation icon */}
                  <div className="relative flex-1">
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={15}
                      value={entry.value}
                      onChange={(e) => updateImeiValue(index, e.target.value)}
                      placeholder="Enter 15-digit IMEI"
                      className={clsx(
                        "w-full rounded-xl border bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 outline-none pl-4 pr-10 py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 tracking-widest font-mono",
                        error
                          ? "border-rose-300 dark:border-rose-700 focus:border-rose-400 dark:focus:border-rose-600 focus:ring-1 focus:ring-rose-200 dark:focus:ring-rose-800"
                          : isValid
                            ? "border-emerald-300 dark:border-emerald-700 focus:border-emerald-400 dark:focus:border-emerald-600 focus:ring-1 focus:ring-emerald-200 dark:focus:ring-emerald-800"
                            : "border-slate-200 dark:border-slate-700 focus:border-[#064a98] dark:focus:border-blue-500 focus:ring-1 focus:ring-[#064a98]/20 dark:focus:ring-blue-500/20",
                      )}
                    />
                    {/* Validation icon */}
                    {entry.value.length > 0 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {isValid ? (
                          <CheckCircle2
                            size={18}
                            className="text-emerald-500"
                          />
                        ) : (
                          <XCircle size={18} className="text-rose-400" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Scan button */}
                  <button
                    type="button"
                    onClick={() => {
                      setScanTarget(index);
                      setScannerOpen(true);
                    }}
                    className="size-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-[#064a98]/10 dark:hover:bg-blue-500/10 hover:border-[#064a98]/30 dark:hover:border-blue-500/30 flex items-center justify-center text-[#064a98] dark:text-blue-400 transition-all active:scale-95 shrink-0"
                    title="Scan Barcode"
                  >
                    <ScanBarcode size={20} strokeWidth={2} />
                  </button>

                  {/* Remove button (only if > 1 slot) */}
                  {imeis.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeImeiSlot(index)}
                      className="size-[46px] rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950 hover:border-rose-200 dark:hover:border-rose-800 hover:text-rose-500 flex items-center justify-center text-slate-400 dark:text-slate-500 transition-all active:scale-95 shrink-0"
                      title="Remove IMEI"
                    >
                      <Trash2 size={16} strokeWidth={2} />
                    </button>
                  )}
                </div>

                {/* Error message */}
                {error && entry.value.length > 0 && (
                  <p className="text-[11px] font-semibold text-rose-500 dark:text-rose-400 pl-1">
                    {error}
                  </p>
                )}

                {/* Status dropdown */}
                {entry.value.length === 15 && !validateImei(entry.value) && (
                  <div className="relative">
                    <select
                      value={entry.status}
                      onChange={(e) =>
                        updateImeiStatus(index, e.target.value as ImeiStatus)
                      }
                      className={clsx(
                        "w-full appearance-none rounded-lg border px-3 py-2 text-xs font-bold transition-colors outline-none cursor-pointer pr-8",
                        getStatusStyle(entry.status),
                      )}
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={14}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-current opacity-50"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Another IMEI */}
        {imeis.length < 3 && (
          <button
            type="button"
            onClick={addImeiSlot}
            className="flex items-center gap-2 text-xs font-bold text-[#064a98] dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors py-1"
          >
            <Plus size={14} strokeWidth={3} />
            Add Another IMEI
          </button>
        )}

        {/* Verify on CEIR */}
        <div className="pt-3 border-t border-slate-50 dark:border-slate-800 space-y-2">
          <a
            href={CEIR_VERIFICATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#064a98] hover:bg-blue-800 text-white rounded-xl font-bold text-xs shadow-md shadow-blue-900/10 transition-all active:scale-[0.98]"
          >
            <ExternalLink size={14} />
            Verify IMEI on CEIR
          </a>
          <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center leading-relaxed">
            Opens CEIR Gov portal. After verifying, update status above.
          </p>
        </div>
      </div>

      {/* Scanner Modal */}
      <ImeiScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleScan}
      />
    </>
  );
}
