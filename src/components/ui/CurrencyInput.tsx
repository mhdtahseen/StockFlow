import React, { useCallback } from "react";
import clsx from "clsx";

// ─── Props ────────────────────────────────────────────────────────────────────

interface CurrencyInputProps {
  value: string;
  onChange: (raw: string) => void;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  symbol?: string;
}

// ─── Formatting ──────────────────────────────────────────────────────────────

/**
 * Formats a numeric string with Indian-style commas (e.g. 10,00,000).
 * Handles decimals correctly.
 */
function formatWithCommas(raw: string): string {
  if (!raw) return "";

  // Split integer and decimal parts
  const parts = raw.split(".");
  let intPart = parts[0];
  const decPart = parts.length > 1 ? `.${parts[1]}` : "";

  // Indian numbering: first group of 3 from right, then groups of 2
  if (intPart.length > 3) {
    const lastThree = intPart.slice(-3);
    const remaining = intPart.slice(0, -3);
    const formatted = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ",");
    intPart = `${formatted},${lastThree}`;
  }

  return `${intPart}${decPart}`;
}

/**
 * Strips all non-numeric characters except decimal point.
 * Ensures only one decimal point exists.
 */
function stripToNumeric(input: string): string {
  // Remove everything except digits and dots
  let cleaned = input.replace(/[^\d.]/g, "");

  // Allow only one decimal point
  const dotIndex = cleaned.indexOf(".");
  if (dotIndex !== -1) {
    cleaned =
      cleaned.slice(0, dotIndex + 1) +
      cleaned.slice(dotIndex + 1).replace(/\./g, "");
  }

  return cleaned;
}

// ─── Component ────────────────────────────────────────────────────────────────

const sizeMap = {
  sm: {
    container: "h-10",
    input: "pl-8 pr-3 text-sm rounded-lg border",
    icon: "left-3 text-sm",
  },
  md: {
    container: "h-12",
    input: "pl-9 pr-4 text-base rounded-xl border-2",
    icon: "left-3.5 text-base",
  },
  lg: {
    container: "h-16",
    input: "pl-11 pr-5 text-2xl rounded-2xl border-2",
    icon: "left-4 text-xl",
  },
};

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  disabled = false,
  autoFocus = false,
  className,
  size = "md",
  symbol = "₹",
}: CurrencyInputProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = stripToNumeric(e.target.value);
      onChange(raw);
    },
    [onChange],
  );

  const displayValue = formatWithCommas(value);
  const styles = sizeMap[size];

  return (
    <div className={clsx("relative w-full", styles.container)}>
      <span
        className={clsx(
          "absolute top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold pointer-events-none transition-all",
          styles.icon,
        )}
      >
        {symbol}
      </span>
      <input
        type="text"
        inputMode="decimal"
        autoFocus={autoFocus}
        disabled={disabled}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={clsx(
          "w-full h-full font-black tracking-tight transition-all outline-none",
          styles.input,
          disabled
            ? "border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed"
            : "border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 dark:focus:border-blue-500 text-slate-900 dark:text-slate-100 placeholder:font-bold placeholder:text-slate-300 dark:placeholder:text-slate-600",
          className,
        )}
      />
    </div>
  );
}
