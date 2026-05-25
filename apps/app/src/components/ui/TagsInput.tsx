import React, { useState, useRef, useMemo } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}

/**
 * Hybrid tag input — dropdown with auto-suggestions + free-text creation.
 * Tags are rendered as removable chips. Suggestions come from previously-used tags.
 */
export function TagsInput({ value, onChange, suggestions = [], placeholder = "Add a tag…" }: Props) {
  const [input, setInput] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    if (!input.trim()) return suggestions.filter((s) => !value.includes(s));
    const q = input.toLowerCase();
    return suggestions
      .filter((s) => s.toLowerCase().includes(q) && !value.includes(s));
  }, [input, suggestions, value]);

  const showCreate = input.trim().length > 0 && !suggestions.some(
    (s) => s.toLowerCase() === input.trim().toLowerCase()
  ) && !value.some((v) => v.toLowerCase() === input.trim().toLowerCase());

  const addTag = (tag: string) => {
    const normalized = tag.trim();
    if (!normalized || value.includes(normalized)) return;
    onChange([...value, normalized]);
    setInput("");
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      if (input.trim()) addTag(input.trim());
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div className="relative">
      {/* Input area with chips */}
      <div
        className={clsx(
          "flex flex-wrap gap-1.5 min-h-[44px] px-3 py-2 rounded-xl border bg-slate-50 dark:bg-slate-900 transition-all cursor-text",
          isFocused
            ? "border-primary-500 ring-2 ring-primary-500/20"
            : "border-slate-200 dark:border-slate-800"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary-100 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800/50 text-xs font-bold text-primary-700 dark:text-primary-300 animate-in zoom-in-75 duration-150"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); removeTag(tag); }}
              className="text-primary-400 hover:text-primary-600 dark:hover:text-primary-200 transition-colors"
            >
              <X size={11} strokeWidth={3} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[80px] bg-transparent text-sm font-semibold text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none"
        />
      </div>

      {/* Dropdown suggestions */}
      {isFocused && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
          {filtered.slice(0, 6).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(suggestion)}
              className="w-full px-3 py-2.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
            >
              <span>{suggestion}</span>
              <span className="text-[10px] text-slate-400 font-medium">used</span>
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(input.trim())}
              className="w-full px-3 py-2.5 text-left text-sm font-bold text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors border-t border-slate-100 dark:border-slate-800 flex items-center gap-2"
            >
              <span className="size-4 rounded bg-primary-500 text-white flex items-center justify-center text-[10px] font-black">+</span>
              Create &ldquo;{input.trim()}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}
