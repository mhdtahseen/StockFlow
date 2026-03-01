/**
 * catalogHelpers.ts
 *
 * Pure helper functions that abstract all deviceCatalog access.
 * These functions are intentionally stateless and side-effect free so they
 * can later be replaced with async API calls without touching any component.
 *
 * Migration path:
 *   getBrandOptions()           → fetchBrands()
 *   getModelOptions(brand)      → fetchModels(brand)
 *   getStorageOptions(b, m)     → fetchStorageOptions(brand, model)
 *   ...etc.
 */

import { deviceCatalog } from "../data/deviceCatalog";

export type ColorOption = { label: string; hex: string };

// ─── Brand ────────────────────────────────────────────────────────────────────

/** Returns a sorted list of all brand names from the catalog. */
export function getBrandOptions(): string[] {
  return Object.keys(deviceCatalog).sort();
}

// ─── Model ────────────────────────────────────────────────────────────────────

/** Returns model names for a given brand, or [] if brand not found. */
export function getModelOptions(brand: string): string[] {
  const entry = deviceCatalog[brand];
  if (!entry) return [];
  return Object.keys(entry.models);
}

// ─── Specs (derived from brand + model) ───────────────────────────────────────

/** Returns RAM options for a specific brand + model. Falls back to []. */
export function getRamOptions(brand: string, model: string): string[] {
  return deviceCatalog[brand]?.models[model]?.ram ?? [];
}

/** Returns storage options for a specific brand + model. Falls back to []. */
export function getStorageOptions(brand: string, model: string): string[] {
  return deviceCatalog[brand]?.models[model]?.storage ?? [];
}

/** Returns color options (with hex) for a specific brand + model. Falls back to []. */
export function getColorOptions(brand: string, model: string): ColorOption[] {
  return deviceCatalog[brand]?.models[model]?.colors ?? [];
}

/** Checks whether a brand exists in the catalog. */
export function isCatalogBrand(brand: string): boolean {
  return brand in deviceCatalog;
}

/** Checks whether a model exists under a catalog brand. */
export function isCatalogModel(brand: string, model: string): boolean {
  return !!deviceCatalog[brand]?.models[model];
}

// ─── Sorting ──────────────────────────────────────────────────────────────────

/**
 * Sorts size strings like "4GB", "128GB", "1TB" in ascending numeric order.
 * Understands MB, GB, and TB suffixes. Unknown formats sort to the end.
 */
export function sortBySize(items: string[]): string[] {
  const toMB = (s: string): number => {
    const match = s.match(/^([\d.]+)\s*(MB|GB|TB)$/i);
    if (!match) return Infinity; // unknown format → sort last
    const num = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    if (unit === "MB") return num;
    if (unit === "GB") return num * 1024;
    if (unit === "TB") return num * 1024 * 1024;
    return Infinity;
  };
  return [...items].sort((a, b) => toMB(a) - toMB(b));
}
