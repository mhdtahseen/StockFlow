import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { BrandCatalog } from "@/data/deviceCatalog"; // reuse types

// Same type as ColorOption from catalogHelpers
export type ColorOption = { label: string; hex: string };

const fetchCatalog = async (): Promise<BrandCatalog> => {
  let allModels: any[] = [];
  let from = 0;
  const batchSize = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase
      .from("catalog_models_v2")
      .select("id, brand, model, storage, ram, colors")
      .order("brand")
      .order("model")
      .range(from, from + batchSize - 1);

    if (error) throw error;

    if (data) {
      allModels = [...allModels, ...data];
      hasMore = data.length === batchSize;
      from += batchSize;
    } else {
      hasMore = false;
    }
  }

  const models = allModels;

  // Transform into the BrandCatalog mapping object
  const map: BrandCatalog = {};

  // Populate structure matching deviceCatalog
  for (const row of models) {
    if (!map[row.brand]) {
      map[row.brand] = { models: {} };
    }

    // Since colors is now a JSONB column in V2, it matches our ColorOption[] type directly
    map[row.brand].models[row.model] = {
      storage: row.storage || [],
      ram: row.ram || [],
      colors: (row.colors as ColorOption[]) || [],
    };
  }

  return map;
};

export function useDeviceCatalog() {
  const {
    data: catalog,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["global_device_catalog"],
    queryFn: fetchCatalog,
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - don't refetch frequently since it's mostly static
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
  });

  // Provide exactly the same helper methods as `src/lib/catalogHelpers.ts` did
  const c = catalog || {};

  return {
    catalog: c,
    isLoading,
    error,

    getBrandOptions: (): string[] => Object.keys(c).sort(),

    getModelOptions: (brand: string): string[] => {
      if (!c[brand]) return [];
      return Object.keys(c[brand].models).sort();
    },

    getRamOptions: (brand: string, model: string): string[] => {
      return c[brand]?.models[model]?.ram ?? [];
    },

    getStorageOptions: (brand: string, model: string): string[] => {
      return c[brand]?.models[model]?.storage ?? [];
    },

    getColorOptions: (brand: string, model: string): ColorOption[] => {
      return c[brand]?.models[model]?.colors ?? [];
    },

    isCatalogBrand: (brand: string): boolean => {
      return brand in c;
    },

    isCatalogModel: (brand: string, model: string): boolean => {
      return !!c[brand]?.models[model];
    },
  };
}

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
