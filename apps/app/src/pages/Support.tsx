import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Mail,
  MessageCircle,
  Bot,
  Search,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { findLocalAnswer, searchFaq, getFaqByCategory } from "@/lib/supportSearch";
import type { FaqItem } from "@/lib/supportSearch";

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  source?: "local" | "cache" | "gemini" | "fallback";
}

// ─── Edge function caller ─────────────────────────────────────────────────────

async function askEdgeFunction(question: string): Promise<{ answer: string | null; fallback?: boolean; message?: string }> {
  const { data, error } = await supabase.functions.invoke("support-chat", {
    body: { question },
  });
  if (error) throw error;
  return data as { answer: string | null; fallback?: boolean; message?: string };
}

// ─── Markdown-lite renderer (bold only) ──────────────────────────────────────

function renderMarkdown(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

// ─── Single FAQ Accordion Item ────────────────────────────────────────────────

function FaqCard({ item }: { item: FaqItem }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug flex-1">
          {item.question}
        </span>
        {open ? (
          <ChevronUp size={16} className="shrink-0 text-slate-400" />
        ) : (
          <ChevronDown size={16} className="shrink-0 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-slate-600 dark:text-slate-400 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-3">
          {renderMarkdown(item.answer)}
        </div>
      )}
    </div>
  );
}

// ─── Chat Message Bubble ──────────────────────────────────────────────────────

function ChatBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div className="size-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0 mt-0.5">
          <Bot size={14} className="text-white" />
        </div>
      )}
      <div
        className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-primary-500 text-white rounded-br-sm"
            : "bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-sm shadow-sm"
        }`}
      >
        {renderMarkdown(msg.text)}
      </div>
    </div>
  );
}

// ─── Main Support Page ────────────────────────────────────────────────────────

export default function Support() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      text: "Hi! I'm the Finventree support assistant. Ask me anything about the app, or browse the FAQ below.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState("");
  const [faqResults, setFaqResults] = useState<FaqItem[]>([]);
  const [faqGrouped, setFaqGrouped] = useState<Record<string, FaqItem[]>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFaqGrouped(getFaqByCategory());
  }, []);

  useEffect(() => {
    if (faqSearch.trim()) {
      setFaqResults(searchFaq(faqSearch));
    } else {
      setFaqResults([]);
    }
  }, [faqSearch]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const q = question.trim();
    if (!q || loading) return;
    setQuestion("");

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      // Layer 1: local FAQ match (instant, offline)
      const local = findLocalAnswer(q);
      if (local) {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: local.answer, source: "local" },
        ]);
        setLoading(false);
        return;
      }

      // Layer 2 & 3: edge function (DB cache → Gemini)
      const result = await askEdgeFunction(q);
      if (result.fallback || !result.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "assistant",
            text:
              result.message ??
              "Our AI assistant is busy right now. Please check the FAQ below or email support@finventree.com.",
            source: "fallback",
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", text: result.answer!, source: result.source as "cache" | "gemini" },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          text: "Something went wrong. Please email support@finventree.com for help.",
          source: "fallback",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [question, loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const displayFaq = faqSearch.trim() ? faqResults : null;

  return (
    <div className="flex flex-col min-h-0 pb-24">
      {/* ── AI Chat Section ──────────────────────────────────────── */}
      <section className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-3">
          <div className="size-8 rounded-full bg-primary-500/10 flex items-center justify-center">
            <Bot size={16} className="text-primary-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">AI Assistant</p>
            <p className="text-[11px] text-slate-400">Powered by Gemini · Usually instant</p>
          </div>
        </div>

        {/* Chat history */}
        <div className="flex flex-col gap-3 mb-3 min-h-[120px]">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} msg={msg} />
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="size-7 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-white" />
              </div>
              <div className="px-3.5 py-2.5 rounded-2xl rounded-bl-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <Loader2 size={14} className="animate-spin text-primary-500" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about the app…"
            className="flex-1 rounded-xl h-11 text-sm bg-white dark:bg-slate-900"
            disabled={loading}
          />
          <Button
            onClick={handleSend}
            disabled={!question.trim() || loading}
            size="icon"
            className="rounded-xl h-11 w-11 bg-primary-500 hover:bg-primary-600 shrink-0"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
      </section>

      {/* ── Divider ──────────────────────────────────────────────── */}
      <div className="mx-4 my-4 border-t border-slate-200 dark:border-slate-800" />

      {/* ── FAQ Section ──────────────────────────────────────────── */}
      <section className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={16} className="text-slate-400" />
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">Frequently Asked Questions</p>
        </div>

        {/* FAQ Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Search FAQ…"
            className="pl-8 h-10 text-sm rounded-xl bg-white dark:bg-slate-900"
          />
        </div>

        {/* FAQ Results */}
        {displayFaq ? (
          displayFaq.length > 0 ? (
            <div className="flex flex-col gap-2 mb-4">
              {displayFaq.map((item) => (
                <FaqCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <AlertCircle size={24} />
              <p className="text-sm">No FAQ matches found. Try asking the AI assistant above.</p>
            </div>
          )
        ) : (
          Object.entries(faqGrouped).map(([category, items]) => (
            <div key={category} className="mb-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {category}
              </p>
              <div className="flex flex-col gap-2">
                {items.map((item) => (
                  <FaqCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          ))
        )}
      </section>

      {/* ── Contact Section ──────────────────────────────────────── */}
      <section className="px-4 mt-2 mb-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">Still need help?</p>
          <p className="text-xs text-slate-500 mb-4">
            Our team responds within 24 hours.
          </p>
          <div className="flex flex-col gap-2">
            <Button
              asChild
              variant="default"
              className="rounded-xl h-11 gap-2 bg-primary-500 hover:bg-primary-600 text-white"
            >
              <a href="mailto:support@finventree.com?subject=Support%20Request">
                <Mail size={16} /> Email Support
              </a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-11 gap-2 border-slate-200 dark:border-slate-800"
            >
              <a
                href="https://wa.me/message/finventree-support"
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={16} className="text-green-600" />
                WhatsApp Support
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
