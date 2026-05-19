import { AutocompleteItem } from "@/components/ui/Autocomplete";

export const PLATFORM_CATALOG: AutocompleteItem[] = [
  {
    id: "cashify",
    label: "Cashify",
    categoryLabel: "Mainstream Platforms",
    aliases: ["cashy", "csh"]
  },
  {
    id: "flipkart-resell",
    label: "Flipkart Resell",
    categoryLabel: "Mainstream Platforms",
    aliases: ["fk", "flipkart", "fkr"]
  },
  {
    id: "olx",
    label: "OLX",
    categoryLabel: "Classifieds",
    aliases: ["olx-india", "olx-resell"]
  }
];
