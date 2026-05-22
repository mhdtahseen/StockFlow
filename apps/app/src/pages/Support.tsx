import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Send,
  Bot,
  User,
  Loader2,
  Mail,
  MessageCircle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Search,
  X,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/lib/supabase";
import { findLocalAnswer, searchFaq, getFaqByCategory } from "@/lib/supportSearch";
import type { FaqItem, SearchResult } from "@/lib/supportSearch";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  /** Quick-reply chips rendered below this bot bubble */
  chips?: string[];
  /** Show the contact card below this bot bubble */
  showContact?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

function makeWelcomeMessage(): ChatMessage {
  return {
    id: "welcome",
    role: "assistant",
    timestamp: new Date(),
    text: "Hi! I'm the Finventree support assistant.\n\nAsk me anything about the app, or tap one of the quick questions below:",
    chips: [
      "How do I add a phone?",
      "How do I create a sales order?",
      "Why isn't my data syncing?",
      "How do I upgrade my plan?",
    ],
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const STORAGE_KEY = "finventree_support_v1";

function loadPersistedMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [makeWelcomeMessage()];
    const parsed: Array<Omit<ChatMessage, "timestamp"> & { timestamp: string }> = JSON.parse(raw);
    return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch {
    return [makeWelcomeMessage()];
  }
}

// ─── Edge function caller ─────────────────────────────────────────────────────

async function askEdgeFunction(question: string): Promise<{ answer: string | null; fallback?: boolean; message?: string }> {
  const { data, error } = await supabase.functions.invoke("support-chat", {
    body: { question },
  });
  if (error) throw error;
  return data as { answer: string | null; fallback?: boolean; message?: string };
}

// ─── Contact link builder ───────────────────────────────────────────────────

/** Strip **bold** markers so email/WhatsApp bodies read as plain text */
function stripMarkdown(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, "$1");
}

/**
 * Builds context-aware mailto: and WhatsApp hrefs from the conversation.
 * The email includes the full transcript; WhatsApp includes the user's questions.
 */
function buildContactLinks(messages: ChatMessage[]): { emailHref: string; waHref: string } {
  const convo = messages.filter((m) => m.id !== "welcome");
  const firstUserQ = convo.find((m) => m.role === "user")?.text ?? "General Inquiry";

  // Use questions only (not AI responses) — full transcript can exceed Android's
  // ~2000-char intent limit and cause the mailto to silently fail.
  const userQuestions = convo
    .filter((m) => m.role === "user")
    .map((m) => `• ${stripMarkdown(m.text)}`)
    .join("\n");

  const emailBody = [
    "Hi Finventree Support Team,",
    "",
    "I need further help with the Finventree app. Here are my questions:",
    "",
    userQuestions || "(no questions recorded)",
    "",
    "Please look into my issue and get back to me.",
    "",
    "Thank you",
  ].join("\n");

  const subject = `Support Request – ${firstUserQ.slice(0, 60)}`;
  const emailHref = `mailto:support@finventree.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;

  const waText = userQuestions
    ? `Hi! I need help with Finventree.\n\nHere are my questions:\n${userQuestions}\n\nPlease assist me.`
    : "Hi! I need help with the Finventree app.";

  const waHref = `https://wa.me/919028747249?text=${encodeURIComponent(waText)}`;

  return { emailHref, waHref };
}

// ─── Markdown renderer ───────────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  return text.split("\n").map((line, li, arr) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
      part.startsWith("**") && part.endsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{part}</span>
      )
    );
    return (
      <React.Fragment key={li}>
        {parts}
        {li < arr.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2">
      <div className="size-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
        <Bot size={13} className="text-white" />
      </div>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="size-1.5 rounded-full bg-slate-400 animate-bounce"
              style={{ animationDelay: `${i * 150}ms`, animationDuration: "900ms" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Chat Bubble ──────────────────────────────────────────────────────────────

function ChatBubble({
  msg,
  onChipClick,
  contactLinks,
}: {
  msg: ChatMessage;
  onChipClick: (chip: string) => void;
  contactLinks: { emailHref: string; waHref: string };
}) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
      <div className={`flex items-end gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar — bot on the left, user on the right */}
        {isUser ? (
          <div className="size-7 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
            <User size={13} className="text-slate-500 dark:text-slate-300" />
          </div>
        ) : (
          <div className="size-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
            <Bot size={13} className="text-white" />
          </div>
        )}
        <div
          className={`px-3.5 py-2 text-sm leading-relaxed break-words ${
            isUser
              /* User: 60vw cap, green right bubble, tail at bottom-right (WhatsApp style) */
              ? "max-w-[60vw] bg-primary-500 text-white rounded-2xl rounded-br-sm shadow-sm"
              /* Bot: white left bubble, tail at bottom-left near avatar */
              : "max-w-[75%] bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-bl-sm shadow-sm"
          }`}
        >
          {renderMarkdown(msg.text)}
        </div>
      </div>
      <p className={`text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 ${isUser ? "pr-9" : "pl-9"}`}>
        {formatTime(msg.timestamp)}
      </p>

      {/* Quick-reply chips */}
      {msg.chips && msg.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pl-9 max-w-[90%]">
          {msg.chips.map((chip) => (
            <button
              key={chip}
              onClick={() => onChipClick(chip)}
              className="text-xs px-3 py-1.5 rounded-full border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Contact card */}
      {msg.showContact && (
        <div className="pl-9 w-full max-w-[85%]">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Still need help? Reach us directly:
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  if (Capacitor.isNativePlatform()) {
                    window.open(contactLinks.emailHref, "_system");
                  } else {
                    window.open(contactLinks.emailHref, "_self");
                  }
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 active:bg-primary-700 rounded-xl px-4 py-2.5 transition-colors"
              >
                <Mail size={14} /> Email Support
              </button>
              <button
                onClick={() => {
                  if (Capacitor.isNativePlatform()) {
                    window.open(contactLinks.waHref, "_system");
                  } else {
                    window.open(contactLinks.waHref, "_blank");
                  }
                }}
                className="flex items-center justify-center gap-2 text-sm font-semibold text-white bg-green-500 hover:bg-green-600 active:bg-green-700 rounded-xl px-4 py-2.5 transition-colors"
              >
                <MessageCircle size={14} /> WhatsApp Support
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FAQ Sheet ────────────────────────────────────────────────────────────────

function FaqSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const results = query.trim() ? searchFaq(query) : null;
  const grouped = getFaqByCategory();

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="bottom" className="h-[85dvh] rounded-t-2xl flex flex-col p-0">
        <SheetHeader className="px-4 pt-4 pb-2 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold">All FAQs</SheetTitle>
            <button
              onClick={onClose}
              className="size-8 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={16} className="text-slate-500" />
            </button>
          </div>
          <div className="relative mt-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search questions…"
              className="pl-8 h-9 text-sm rounded-xl"
            />
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          {results ? (
            results.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No results found.</p>
            ) : (
              <div className="space-y-1.5">
                {results.map((item) => (
                  <FaqAccordionItem
                    key={item.id}
                    item={item}
                    open={openId === item.id}
                    onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                  />
                ))}
              </div>
            )
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  {cat}
                </p>
                <div className="space-y-1.5">
                  {items.map((item) => (
                    <FaqAccordionItem
                      key={item.id}
                      item={item}
                      open={openId === item.id}
                      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function FaqAccordionItem({
  item,
  open,
  onToggle,
}: {
  item: FaqItem;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-3 text-left"
      >
        <span className="text-sm font-medium text-slate-800 dark:text-slate-200 leading-snug flex-1">
          {item.question}
        </span>
        {open ? (
          <ChevronUp size={14} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={14} className="shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
          {renderMarkdown(item.answer)}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function Support() {
  const [messages, setMessages] = useState<ChatMessage[]>(loadPersistedMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [faqSheetOpen, setFaqSheetOpen] = useState(false);
  // Ref on the SCROLL CONTAINER (not the end sentinel) so we can imperatively scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of the messages container on every new message or typing change
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  // Persist conversation to localStorage (restore on reload)
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages)); } catch {}
  }, [messages]);

  // Build contact links once per render — not recalculated inside every bubble
  const contactLinks = useMemo(() => buildContactLinks(messages), [messages]);

  const clearChat = useCallback(() => {
    setMessages([makeWelcomeMessage()]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {};
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || isTyping) return;

      setInput("");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", timestamp: new Date(), text: q },
      ]);
      setIsTyping(true);

      if (!navigator.onLine) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date(),
            text: "You appear to be offline. Please check your connection and try again.",
          },
        ]);
        setIsTyping(false);
        return;
      }

      // Small delay so the typing indicator feels natural
      await new Promise((r) => setTimeout(r, 650));

      try {
        // Layer 1: local FAQ match via MiniSearch (stemmed BM25, instant, works offline)
        const localResults = findLocalAnswer(q, 2);
        if (localResults && localResults.length > 0) {
          // Build answer from top results
          let answerText: string;
          const topItem = localResults[0].item;

          if (localResults.length === 1) {
            answerText = topItem.answer;
          } else {
            // Multiple relevant results: combine answers with context
            answerText = localResults
              .map((r) => `**${r.item.question}**\n${r.item.answer}`)
              .join("\n\n");
          }

          // Suggest related questions from the same category
          const allFaqs = getFaqByCategory();
          const usedIds = new Set(localResults.map((r) => r.item.id));
          const related = (allFaqs[topItem.category] ?? [])
            .filter((f) => !usedIds.has(f.id))
            .slice(0, 2)
            .map((f) => f.question);

          setMessages((prev) => [
            ...prev,
            {
              id: crypto.randomUUID(),
              role: "assistant",
              timestamp: new Date(),
              text: answerText,
              chips: [...related, "I need more help"],
            },
          ]);
          setIsTyping(false);
          return;
        }

        // Layer 2 & 3: edge function (DB cache → Gemini)
        const result = await askEdgeFunction(q);
        const isEscalation =
          !result.answer ||
          !!result.fallback ||
          q.toLowerCase().includes("more help") ||
          q.toLowerCase().includes("human") ||
          q.toLowerCase().includes("agent");

        const answer =
          result.fallback || !result.answer
            ? (result.message ?? "Our AI assistant is busy right now. You can email us or try browsing all FAQs.")
            : result.answer!;

        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date(),
            text: answer,
            chips: isEscalation ? undefined : ["I need more help"],
            showContact: isEscalation,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date(),
            text: "Something went wrong on my end. Please email support@finventree.com and we'll sort it out.",
            showContact: true,
          },
        ]);
      } finally {
        setIsTyping(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [isTyping]
  );

  const handleChip = useCallback(
    (chip: string) => {
      if (chip === "I need more help") {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "user", timestamp: new Date(), text: chip },
          {
            id: crypto.randomUUID(),
            role: "assistant",
            timestamp: new Date(),
            text: "No problem! Here's how to reach our team directly:",
            showContact: true,
          },
        ]);
        return;
      }
      sendMessage(chip);
    },
    [sendMessage]
  );

  return (
    <>
      {/*
        h-full fills AppLayout's <main> (which has a fixed height from h-[100dvh] overflow-hidden).
        flex-col lets top-bar, messages, and input stack vertically.
      */}
      <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-950">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <p className="text-xs text-slate-400">Powered by Gemini AI</p>
          <div className="flex items-center gap-3">
            <button
              onClick={clearChat}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <RotateCcw size={11} /> Clear
            </button>
            <button
              onClick={() => setFaqSheetOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline"
            >
              <BookOpen size={12} /> Browse all FAQs
            </button>
          </div>
        </div>

        {/*
          Messages area: flex-1 + overflow-y-auto + min-h-0 (critical — allows flex child to shrink).
          Inner flex-col with a flex-1 spacer before messages pushes them to the bottom.
          As messages grow the spacer shrinks and eventually the list scrolls.
        */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto min-h-0 flex flex-col"
        >
          <div className="flex-1" />
          <div className="px-4 pt-4 pb-2 space-y-4">
            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                msg={msg}
                onChipClick={handleChip}
                contactLinks={contactLinks}
              />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </div>

        {/*
          Input bar: shrink-0 so it never shrinks, bg clips the BottomNav overlap,
          pb clears the fixed BottomNav (≈ 64px) plus device safe-area inset.
        */}
        <div className="shrink-0 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-3 pt-3 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              placeholder="Type your question…"
              className="flex-1 rounded-full h-10 text-sm bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 px-4"
              disabled={isTyping}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              size="icon"
              className="rounded-full h-10 w-10 bg-primary-500 hover:bg-primary-600 shrink-0"
            >
              {isTyping ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Send size={15} />
              )}
            </Button>
          </div>
        </div>
      </div>

      <FaqSheet open={faqSheetOpen} onClose={() => setFaqSheetOpen(false)} />
    </>
  );
}
