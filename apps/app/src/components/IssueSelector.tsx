import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, ChevronDown, X, Plus, CheckCircle2 } from "lucide-react";
import clsx from "clsx";
import { issuesFlatList, severityColorMap } from "@/data/issueCatalog";
import ReusableAutocomplete from "./ui/ReusableAutocomplete";

interface IssueSelectorProps {
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
  topIssues: string[];
  tagQuery: string;
  setTagQuery: (query: string) => void;
  showIssues: boolean;
  setShowIssues: (show: boolean) => void;
  title?: string;
  className?: string;
}

export const IssueSelector: React.FC<IssueSelectorProps> = ({
  selectedTags,
  onToggleTag,
  topIssues,
  tagQuery,
  setTagQuery,
  showIssues,
  setShowIssues,
  title = "Condition / Issues",
  className,
}) => {
  return (
    <div className={clsx("divide-y divide-slate-100 dark:divide-slate-800", className)}>
      <div className={clsx("px-5 pb-3", !showIssues && "rounded-b-[inherit]")}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Wrench size={14} className="text-primary-500" />
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">
              {title}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowIssues(!showIssues)}
            className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 uppercase tracking-widest transition-colors flex items-center gap-1"
          >
            {showIssues ? "Collapse" : "Expand Catalog"}
            <ChevronDown 
              size={12} 
              className={clsx("transition-transform", showIssues && "rotate-180")} 
            />
          </button>
        </div>

        {/* Selected Tags Summary with +N wrap */}
        <div className="flex flex-wrap gap-1.5 min-h-[32px]">
          {selectedTags.length > 0 ? (
            <>
              {selectedTags.slice(0, 3).map((tag) => {
                const item = issuesFlatList.find(i => i.label === tag || i.aliases?.includes(tag));
                const severity = (item?.severity || 1) as 1 | 2 | 3 | 4 | 5;
                const colors = severityColorMap[severity];
                return (
                  <motion.span
                    key={tag}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all"
                    style={{
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.text + "30",
                    }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      className="hover:scale-110 active:scale-90 transition-transform"
                    >
                      <X size={10} strokeWidth={3} />
                    </button>
                  </motion.span>
                );
              })}
              {selectedTags.length > 3 && (
                <button
                  type="button"
                  onClick={() => setShowIssues(true)}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  +{selectedTags.length - 3} more
                </button>
              )}
            </>
          ) : (
            <span className="text-[10px] font-bold text-slate-400 italic">
              No issues detected (Clear Device)
            </span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showIssues && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
          >
            <div className="p-5 space-y-4 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-[inherit]">
              {/* Quick Select Buttons */}
              <div className="flex flex-wrap gap-2">
                {topIssues.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  const item = issuesFlatList.find(i => i.label === tag || i.aliases?.includes(tag));
                  const severity = (item?.severity || 1) as 1 | 2 | 3 | 4 | 5;
                  const colors = severityColorMap[severity];
                  
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => onToggleTag(tag)}
                      className={clsx(
                        "px-3 py-2 rounded-xl text-[10px] font-bold tracking-tight transition-all border flex items-center gap-1.5",
                        isSelected
                          ? "bg-slate-900 border-slate-900 text-white shadow-lg active:scale-95"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-primary-500/30",
                      )}
                      style={isSelected ? {
                        backgroundColor: colors.text,
                        borderColor: colors.text
                      } : {}}
                    >
                      {tag}
                      {isSelected ? <CheckCircle2 size={12} /> : <Plus size={12} className="opacity-40" />}
                    </button>
                  );
                })}
              </div>

              {/* Catalog Search */}
              <div className="relative">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">
                  Search Catalog
                </label>
                <ReusableAutocomplete
                  data={issuesFlatList}
                  value={tagQuery}
                  onChange={setTagQuery}
                  onSelect={(val) => {
                    const t = val.trim();
                    if (t) {
                      // Always add if not present, and clear input
                      if (!selectedTags.includes(t)) {
                        onToggleTag(t);
                      }
                      setTagQuery("");
                    } else {
                      // Enter on empty input -> Close
                      setShowIssues(false);
                    }
                  }}
                  placeholder="Search 1,000+ conditions..."
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IssueSelector;
