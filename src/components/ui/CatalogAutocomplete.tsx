/**
 * CatalogAutocomplete
 *
 * A fully-accessible, keyboard-navigable autocomplete component styled to
 * match the StockFlow design system (Tailwind + dark mode).
 *
 * It is intentionally generic — it accepts plain string options OR richer
 * ColorOption objects (with a hex swatch). The parent passes pre-computed
 * filtered options; filtering is done locally inside this component so the
 * parent never needs to re-derive options on every keystroke.
 */

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";
import { Check } from "lucide-react";
import clsx from "clsx";
import { ColorOption } from "../../lib/catalogHelpers";

// ─── Types ────────────────────────────────────────────────────────────────────

type OptionItem = string | ColorOption;

interface CatalogAutocompleteProps {
  /** Plain-string or ColorOption items to suggest */
  options: OptionItem[];
  /** Controlled value (the label string) */
  value: string;
  /** Called with the new label string whenever user commits a value */
  onChange: (value: string) => void;
  /** Label shown above the input */
  label: string;
  /** Placeholder text */
  placeholder?: string;
  /** Icon rendered on the left side of the input */
  icon?: React.ReactNode;
  /** Disabled state (grays out + no interaction) */
  disabled?: boolean;
  /** Error message to display below */
  error?: string;
  /** Whether this field is optional */
  optional?: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLabel(item: OptionItem): string {
  return typeof item === "string" ? item : item.label;
}

function isColorOption(item: OptionItem): item is ColorOption {
  return typeof item === "object" && "hex" in item;
}

function scoreMatch(label: string, query: string): number {
  const l = label.toLowerCase();
  const q = query.toLowerCase();
  if (l === q) return 3;
  if (l.startsWith(q)) return 2;
  if (l.includes(q)) return 1;
  return 0;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const CatalogAutocomplete: React.FC<CatalogAutocompleteProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Type to search…",
  icon,
  disabled = false,
  error,
  optional = false,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep query in sync when value is reset externally (e.g. brand change)
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Filtered + ranked options — computed only when options or query changes
  const filtered = useMemo<OptionItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50); // show first 50 when no query
    return options
      .map((item) => ({ item, score: scoreMatch(getLabel(item), q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 50);
  }, [options, query]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex >= 0 && listRef.current) {
      const el = listRef.current.querySelector<HTMLLIElement>(
        `[data-index="${activeIndex}"]`,
      );
      el?.scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  const commit = useCallback(
    (item: OptionItem) => {
      const labelStr = getLabel(item);
      setQuery(labelStr);
      onChange(labelStr);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v); // propagate even custom text immediately
    setOpen(true);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && filtered[activeIndex]) {
          commit(filtered[activeIndex]);
        } else {
          // commit freeform text
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  };

  const showDropdown = open && filtered.length > 0 && !disabled;

  return (
    <div ref={containerRef} className="relative group">
      {/* Label */}
      <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
        {label}
        {optional && (
          <span className="normal-case text-[9px] font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
            optional
          </span>
        )}
      </label>

      {/* Input */}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none">
            {icon}
          </span>
        )}
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => !disabled && setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "—" : placeholder}
          aria-autocomplete="list"
          aria-expanded={showDropdown}
          role="combobox"
          className={clsx(
            "w-full rounded-xl border py-3.5 text-sm font-bold transition-all",
            "placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:outline-none focus:ring-1",
            icon ? "pl-10 pr-4" : "px-4",
            disabled
              ? "border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-600 cursor-not-allowed"
              : [
                  "border-slate-200 dark:border-slate-700",
                  "bg-slate-50 dark:bg-slate-800",
                  "hover:bg-slate-100 dark:hover:bg-slate-750",
                  "focus:bg-white dark:focus:bg-slate-800",
                  "focus:border-[#064a98] dark:focus:border-blue-500",
                  "focus:ring-[#064a98]/20 dark:focus:ring-blue-500/20",
                  "text-slate-900 dark:text-slate-100",
                ],
          )}
        />
        {/* Clear button when value is set */}
        {query && !disabled && (
          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              onChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors text-lg leading-none"
            aria-label="Clear"
          >
            ×
          </button>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <ul
          ref={listRef}
          role="listbox"
          className={clsx(
            "absolute z-[200] mt-1.5 w-full rounded-xl border shadow-lg overflow-auto",
            "bg-white dark:bg-slate-900",
            "border-slate-100 dark:border-slate-700",
            "max-h-56",
          )}
        >
          {filtered.map((item, idx) => {
            const labelStr = getLabel(item);
            const isActive = idx === activeIndex;
            const isSelected = labelStr === value;
            const hasColor = isColorOption(item);

            return (
              <li
                key={labelStr}
                data-index={idx}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(e) => {
                  e.preventDefault(); // don't blur input
                  commit(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={clsx(
                  "flex items-center gap-2.5 px-3.5 py-2.5 cursor-pointer text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-[#064a98]/5 dark:bg-blue-500/10 text-[#064a98] dark:text-blue-400"
                    : isSelected
                      ? "bg-blue-50 dark:bg-blue-950/40 text-[#064a98] dark:text-blue-300"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                {/* Color swatch */}
                {hasColor && (
                  <span
                    className="shrink-0 size-4 rounded-full border border-black/10 dark:border-white/10 shadow-sm"
                    style={{ backgroundColor: (item as ColorOption).hex }}
                    title={(item as ColorOption).hex}
                  />
                )}
                <span className="flex-1 truncate">{labelStr}</span>
                {isSelected && (
                  <Check
                    size={14}
                    strokeWidth={2.5}
                    className="shrink-0 text-[#064a98] dark:text-blue-400"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* Error */}
      {error && (
        <span className="text-red-500 text-xs font-semibold block mt-1">
          {error}
        </span>
      )}
    </div>
  );
};

export default CatalogAutocomplete;
