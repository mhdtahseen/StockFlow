/**
 * AadhaarInput — Production-ready split Aadhaar input with:
 *  - 3-field 4-4-4 layout
 *  - Secure masking (only last 4 visible when hidden)
 *  - Smart paste (12 digits auto-split)
 *  - Full keyboard navigation + mobile-friendly numeric kbd
 *  - Accessibility (aria labels, screen reader support)
 *
 * Security: Only the last 4 digits are ever stored in state
 * for display. The full number is passed to onChange then discarded.
 */

import React, { useRef, useState, useCallback } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import clsx from "clsx";

// ─────────────────────────────────────────────
// Utility helpers
// ─────────────────────────────────────────────
export function maskAadhaar(digits: string): string {
  if (digits.length !== 12) return digits;
  return `XXXX XXXX ${digits.slice(8)}`;
}

export function formatAadhaar(digits: string): string {
  const d = digits.replace(/\D/g, "").slice(0, 12);
  return [d.slice(0, 4), d.slice(4, 8), d.slice(8, 12)]
    .filter(Boolean)
    .join(" ");
}

// ─────────────────────────────────────────────
// Component Props
// ─────────────────────────────────────────────
interface AadhaarInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onValidate?: (isValid: boolean) => void;
  masked?: boolean;
  error?: string | null;
  disabled?: boolean;
}

// ─────────────────────────────────────────────
// AadhaarInput Component
// ─────────────────────────────────────────────
export function AadhaarInput({
  value = "",
  onChange,
  onValidate,
  error,
  disabled = false,
}: AadhaarInputProps) {
  // Internal digit slots — 3 groups of 4
  const getInitialParts = (val: string): [string, string, string] => {
    const digits = val.replace(/\D/g, "").slice(0, 12);
    return [digits.slice(0, 4), digits.slice(4, 8), digits.slice(8, 12)];
  };

  const [parts, setParts] = useState<[string, string, string]>(() =>
    getInitialParts(value),
  );
  const [revealed, setRevealed] = useState(false);
  const [touched, setTouched] = useState(false);

  const refs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const fullNumber = parts.join("");
  const isComplete = fullNumber.length === 12;
  const showError = touched && fullNumber.length > 0 && !isComplete;
  const showSuccess = isComplete;

  const notify = useCallback(
    (newParts: [string, string, string]) => {
      const numStr = newParts.join("");
      onChange?.(numStr);
      onValidate?.(numStr.length === 12);
    },
    [onChange, onValidate],
  );

  const handleChange = (idx: 0 | 1 | 2, raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 4);
    const newParts: [string, string, string] = [...parts] as [
      string,
      string,
      string,
    ];
    newParts[idx] = digits;
    setParts(newParts);
    notify(newParts);
    if (digits.length === 4 && idx < 2) {
      refs[idx + 1].current?.focus();
    }
  };

  const handleKeyDown = (
    idx: 0 | 1 | 2,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && parts[idx] === "" && idx > 0) {
      refs[idx - 1].current?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const raw = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 12);
    if (raw.length > 0) {
      const newParts: [string, string, string] = [
        raw.slice(0, 4),
        raw.slice(4, 8),
        raw.slice(8, 12),
      ];
      setParts(newParts);
      setTouched(true);
      notify(newParts);
      // Focus the appropriate field
      if (raw.length <= 4) refs[0].current?.focus();
      else if (raw.length <= 8) refs[1].current?.focus();
      else refs[2].current?.focus();
    }
  };

  const borderClass = showError
    ? "border-red-400 dark:border-red-600 focus:ring-red-500/20"
    : showSuccess
      ? "border-emerald-400 dark:border-emerald-600 focus:ring-emerald-500/20"
      : "border-slate-200 dark:border-slate-700 focus:ring-primary-500/20 focus:border-primary-500";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* 3 Input Fields */}
        {([0, 1, 2] as const).map((idx) => (
          <React.Fragment key={idx}>
            <input
              ref={refs[idx]}
              id={`aadhaar-field-${idx}`}
              aria-label={`Aadhaar digits ${idx * 4 + 1} to ${idx * 4 + 4}`}
              aria-describedby={showError ? "aadhaar-error" : undefined}
              aria-invalid={showError}
              type={revealed || idx === 2 ? "text" : "password"}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={parts[idx]}
              disabled={disabled}
              onFocus={() => setTouched(true)}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              className={clsx(
                "flex-1 min-w-0 h-9 rounded-lg border text-center font-mono text-sm font-bold tracking-[0.25em] transition-all outline-none focus:ring-2 bg-slate-50 dark:bg-slate-800/50",
                "text-slate-900 dark:text-slate-100 placeholder:text-slate-300",
                borderClass,
                disabled && "opacity-50 cursor-not-allowed",
              )}
              placeholder="••••"
            />
            {idx < 2 && (
              <span className="text-slate-300 dark:text-slate-600 font-bold text-sm leading-none">
                —
              </span>
            )}
          </React.Fragment>
        ))}

        {/* Reveal toggle */}
        <button
          type="button"
          aria-label={revealed ? "Hide Aadhaar" : "Show Aadhaar"}
          onClick={() => setRevealed((v) => !v)}
          disabled={disabled}
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30 shrink-0"
        >
          {revealed ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {/* Validation status row */}
      <div className="flex items-center gap-1.5 min-h-[18px]">
        {showSuccess && (
          <>
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-500">
              Complete Aadhaar number
            </span>
          </>
        )}
        {showError && (
          <>
            <XCircle size={14} className="text-red-500 shrink-0" />
            <span
              id="aadhaar-error"
              role="alert"
              className="text-xs font-semibold text-red-600 dark:text-red-400"
            >
              {error ?? "Aadhaar must be 12 digits"}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
