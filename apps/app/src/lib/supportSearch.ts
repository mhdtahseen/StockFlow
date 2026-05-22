import MiniSearch from "minisearch";
import { stemmer } from "stemmer";
import faqData from "@/data/faq.json";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  keywords: string[];
  answer: string;
}

const FAQ: FaqItem[] = faqData as FaqItem[];

// ─── Stop words ──────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","but",
  "how","what","why","when","where","do","does","can","i","my","me","we",
  "you","your","this","that","with","from","be","was","are","have","has",
  "not","no","so","if","up","out","get","go","by","as","its","into","please",
  "help","tell","show","give","want","need","using","use","about","explain",
  "would","could","should","just","really","very","also","like",
]);

// ─── MiniSearch index (built once at module load) ────────────────────────────

function processTerm(term: string): string | null {
  const lower = term.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!lower || lower.length < 2 || STOPWORDS.has(lower)) return null;
  return stemmer(lower);
}

const miniSearch = new MiniSearch<FaqItem>({
  fields: ["question", "keywordsText"],
  storeFields: ["id", "question", "answer", "category", "keywords"],
  processTerm,
  searchOptions: {
    prefix: true,
    fuzzy: 0.2,
    boost: { keywordsText: 2, question: 1 },
    combineWith: "OR",
  },
});

// Index FAQ items — flatten keywords into a text field for MiniSearch
miniSearch.addAll(
  FAQ.map((item) => ({
    ...item,
    keywordsText: item.keywords.join(" "),
  }))
);

// ─── Public API ──────────────────────────────────────────────────────────────

export interface SearchResult {
  item: FaqItem;
  score: number;
}

/**
 * Finds the best FAQ match(es) for a user question using BM25 + stemming.
 * Returns up to `maxResults` items above the score threshold, or null if none qualify.
 */
export function findLocalAnswer(
  question: string,
  maxResults = 2
): SearchResult[] | null {
  if (!question.trim()) return null;

  const results = miniSearch.search(question);
  if (results.length === 0) return null;

  // MiniSearch returns results sorted by score descending.
  // Take top results that are above a meaningful threshold.
  const topScore = results[0].score;
  const threshold = topScore * 0.4; // include results within 40% of top score

  const qualified = results
    .filter((r) => r.score >= threshold)
    .slice(0, maxResults)
    .map((r) => ({
      item: FAQ.find((f) => f.id === r.id)!,
      score: r.score,
    }));

  // Only return if the top result has a meaningful absolute score
  // (low absolute scores mean very weak matches)
  if (qualified.length === 0 || qualified[0].score < 1.5) return null;

  return qualified;
}

/**
 * Returns the single best match (for backwards compatibility with the chat flow).
 */
export function findBestAnswer(question: string): FaqItem | null {
  const results = findLocalAnswer(question, 1);
  return results?.[0]?.item ?? null;
}

/** Search FAQ items (for the FAQ sheet search bar). */
export function searchFaq(query: string): FaqItem[] {
  if (!query.trim()) return FAQ;

  const results = miniSearch.search(query, {
    prefix: true,
    fuzzy: 0.3,
    combineWith: "OR",
  });

  if (results.length === 0) {
    // Fallback: simple substring match on question text
    const lq = query.toLowerCase();
    return FAQ.filter(
      (item) =>
        item.question.toLowerCase().includes(lq) ||
        item.category.toLowerCase().includes(lq)
    );
  }

  return results.map((r) => FAQ.find((f) => f.id === r.id)!);
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
