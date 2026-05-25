import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
} from "react";
import { Check, Search } from "lucide-react";
import clsx from "clsx";
import { ColorOption } from "@/hooks/useDeviceCatalog";

type OptionItem = string | ColorOption;

interface CatalogAutocompleteProps {
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
  label?: React.ReactNode;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  error?: string;
  optional?: boolean;
  onSelect?: (val: string) => void;
}

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

export const CatalogAutocomplete: React.FC<CatalogAutocompleteProps> = ({
  options,
  value,
  onChange,
  label,
  placeholder = "Type to search…",
  icon,
  disabled = false,
  error,
  optional,
  onSelect,
}) => {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const filtered = useMemo<OptionItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options.slice(0, 50);
    return options
      .map((item) => ({ item, score: scoreMatch(getLabel(item), q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ item }) => item)
      .slice(0, 50);
  }, [options, query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
      if (onSelect) onSelect(labelStr);
      setOpen(false);
      setActiveIndex(-1);
    },
    [onChange, onSelect],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    onChange(v);
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
        } else if (query.trim()) {
           onChange(query.trim());
           if (onSelect) onSelect(query.trim());
           setOpen(false);
        } else {
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
    <div ref={containerRef} className="relative group w-full">
      {label && (
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500 mb-2 block ml-1 transition-colors group-focus-within:text-primary-500">
          {label}
          {optional && (
            <span className="ml-1 text-[8px] text-slate-400 font-bold lowercase italic">
              (optional)
            </span>
          )}
        </label>
      )}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none z-10">
          {icon || <Search size={18} />}
        </div>
        <input
          ref={inputRef}
          type="text"
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={handleInputChange}
          onFocus={() => {
            if (!disabled) {
              setOpen(true);
              // Note: scroll-into-view is handled globally by App.tsx (keyboardDidShow)
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "—" : placeholder}
          className={clsx(
            "w-full h-12 rounded-xl border-2 transition-all font-black pl-11 pr-4 text-sm",
            disabled
              ? "bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 text-slate-400 cursor-not-allowed"
              : [
                  "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800",
                  "hover:border-slate-200 dark:hover:border-slate-700",
                  "focus:border-primary-500 dark:focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10",
                  "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 placeholder:font-bold",
                ],
          )}
        />
        {query && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              onChange("");
              setOpen(true);
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 size-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <XIcon size={14} strokeWidth={3} />
          </button>
        )}
      </div>

      {showDropdown && (
        <ul
          ref={listRef}
          className="absolute z-[100] mt-2 w-full rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 dark:shadow-black/40 overflow-y-auto max-h-[40vh] sm:max-h-64 py-2 custom-scrollbar overscroll-contain touch-pan-y"
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(item);
                }}
                onMouseEnter={() => setActiveIndex(idx)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 cursor-pointer text-sm font-black transition-colors",
                  isActive
                    ? "bg-primary-500/10 text-primary-500"
                    : isSelected
                      ? "bg-slate-50 dark:bg-slate-800 text-primary-500"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800",
                )}
              >
                {hasColor && (
                  <span
                    className="size-4 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: (item as ColorOption).hex }}
                  />
                )}
                <span className="flex-1 truncate tracking-tight">{labelStr}</span>
                {isSelected && (
                  <Check
                    size={16}
                    strokeWidth={3}
                    className="text-primary-500"
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && (
        <span className="text-rose-500 text-[10px] font-black uppercase tracking-widest mt-1 ml-1 block">
          {error}
        </span>
      )}
    </div>
  );
};

const XIcon = ({ size = 20, strokeWidth = 2, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default CatalogAutocomplete;
