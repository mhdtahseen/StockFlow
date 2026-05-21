import faqData from "@/data/faq.json";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}

const FAQ: FaqItem[] = faqData as FaqItem[];

const STOPWORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
  "how","what","why","when","where","do","does","can","i","my","me","we",
  "you","your","this","that","with","from","be","was","are","have","has",
  "not","no","so","if","up","out","get","go","by","as","its","into","please",
  "help","tell","show","give","want","need","using","use",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

/** Returns the best-matching FAQ item if score >= threshold, else null. */
export function findLocalAnswer(question: string): FaqItem | null {
  if (!question.trim()) return null;

  const tokens = new Set(tokenize(question));
  if (tokens.size === 0) return null;

  let best: FaqItem | null = null;
  let bestScore = 0;

  for (const item of FAQ) {
    const kwSet = new Set(item.keywords);
    let hits = 0;
    for (const t of tokens) {
      if (kwSet.has(t)) hits++;
    }
    // Jaccard-like: hits / union size
    const union = new Set([...tokens, ...kwSet]).size;
    const score = hits / union;
    if (score > bestScore) {
      bestScore = score;
      best = item;
    }
  }

  // Also check question title similarity
  if (best === null || bestScore < 0.08) {
    // Try substring match on question text
    const lq = question.toLowerCase();
    for (const item of FAQ) {
      if (item.question.toLowerCase().split(" ").some((w) => lq.includes(w) && w.length > 4)) {
        const titleTokens = new Set(tokenize(item.question));
        let hits = 0;
        for (const t of tokens) {
          if (titleTokens.has(t)) hits++;
        }
        const union = new Set([...tokens, ...titleTokens]).size;
        const score = hits / union;
        if (score > bestScore) {
          bestScore = score;
          best = item;
        }
      }
    }
  }

  return bestScore >= 0.08 ? best : null;
}

/** Filter FAQ items whose question or keywords match a search query. */
export function searchFaq(query: string): FaqItem[] {
  if (!query.trim()) return FAQ;
  const tokens = tokenize(query);
  if (tokens.size === 0) return FAQ;

  const lq = query.toLowerCase();
  return FAQ.filter((item) => {
    if (item.question.toLowerCase().includes(lq)) return true;
    if (item.category.toLowerCase().includes(lq)) return true;
    return tokens.some((t) => item.keywords.includes(t));
  });
}

/** Returns all FAQ items grouped by category. */
export function getFaqByCategory(): Record<string, FaqItem[]> {
  const grouped: Record<string, FaqItem[]> = {};
  for (const item of FAQ) {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  }
  return grouped;
}

export { FAQ };
export type { FaqItem };
