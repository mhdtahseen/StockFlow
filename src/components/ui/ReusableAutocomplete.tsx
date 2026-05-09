import React, { useState, useRef, useEffect, useMemo } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import Fuse from "fuse.js";

export type AutocompleteItem = {
  id: string;
  label: string;
  categoryLabel?: string;
  aliases?: string[];
  severity?: 1 | 2 | 3 | 4 | 5;
};

export interface ReusableAutocompleteProps {
  data: AutocompleteItem[];
  placeholder?: string;
  value: string;
  onChange: (val: string) => void;
  onSelect?: (val: string) => void;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}

export default function ReusableAutocomplete({
  data,
  placeholder = "Search...",
  value,
  onChange,
  onSelect,
  icon,
  autoFocus = false,
}: ReusableAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fuse = useMemo(
    () =>
      new Fuse(data, {
        keys: ["label", "aliases"],
        threshold: 0.3,
        ignoreLocation: true,
      }),
    [data],
  );

  const filteredItems = useMemo(() => {
    if (!value.trim()) {
      return data.slice(0, 15);
    }
    const results = fuse.search(value.trim());
    return results.map((r) => r.item).slice(0, 15);
  }, [value, fuse, data]);

  // Open dropdown when typing or when value is cleared while focused
  useEffect(() => {
    if (filteredItems.length > 0) {
      if (value.trim()) {
        setIsOpen(true);
      }
    } else {
      setIsOpen(false);
    }
  }, [value, filteredItems.length]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && value.trim()) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredItems.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > -1 ? prev - 1 : prev));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (
        isOpen &&
        highlightedIndex >= 0 &&
        highlightedIndex < filteredItems.length
      ) {
        const selected = filteredItems[highlightedIndex].label;
        onChange(selected);
        if (onSelect) onSelect(selected);
        setIsOpen(false);
        setHighlightedIndex(-1);
      } else if (value.trim()) {
        // Add custom entry
        onChange(value.trim());
        if (onSelect) onSelect(value.trim());
        setIsOpen(false);
        setHighlightedIndex(-1);
      } else {
        // Enter on empty input -> Close dropdown/selector
        setIsOpen(false);
        if (onSelect) onSelect(""); // Signal empty submit
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  };

  return (
    <div className="relative w-full scroll-mt-30" ref={containerRef}>
      <div className="flex relative items-center">
        {icon && (
          <div className="absolute left-3 flex items-center justify-center text-slate-400 dark:text-slate-500">
            {icon}
          </div>
        )}
        <input
          type="text"
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => {
            onChange(e.target.value);
            setHighlightedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            setIsOpen(true); // Open on focus even if empty
            setTimeout(() => {
              containerRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }, 250); // slight delay allowing keyboard to deploy
          }}
          className={clsx(
            "w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-primary-500 dark:focus:border-blue-500 focus:ring-1 focus:ring-primary-500/20 dark:focus:ring-blue-500/20 outline-none py-3 text-sm font-semibold text-slate-900 dark:text-slate-100 transition-all placeholder:font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500",
            icon ? "pl-10 pr-4" : "px-4",
          )}
          placeholder={placeholder}
          autoComplete="off"
        />
      </div>

      {isOpen && (
        <div className="absolute z-[99] w-full mt-2 bg-white dark:bg-slate-900 rounded-xl shadow-xl shadow-black/10 dark:shadow-black/40 border border-slate-100 dark:border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
          {filteredItems.map((item, index) => {
            const isHighlighted = index === highlightedIndex;
            const showCategory =
              index === 0 ||
              item.categoryLabel !== filteredItems[index - 1].categoryLabel;

            return (
              <React.Fragment key={item.id}>
                {showCategory && item.categoryLabel && (
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 bg-slate-50/80 dark:bg-slate-800/80 sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                    {item.categoryLabel}
                  </div>
                )}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent loss of focus on input
                    onChange(item.label);
                    if (onSelect) onSelect(item.label);
                    setIsOpen(false);
                    setHighlightedIndex(-1);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={clsx(
                    "w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors flex items-center justify-between",
                    isHighlighted
                      ? "bg-primary-500/10 dark:bg-blue-500/20 text-primary-500 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                  )}
                >
                  <span>{item.label}</span>
                  {isHighlighted && <Plus size={14} className="opacity-50" />}
                </button>
              </React.Fragment>
            );
          })}
        </div>
      )}
    </div>
  );
}
