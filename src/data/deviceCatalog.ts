type ColorOption = {
  label: string;
  hex: string;
};

type ModelSpec = {
  storage: string[];
  ram: string[];
  colors: ColorOption[];
};

export type BrandCatalog = Record<
  string, // brand name e.g. "Oppo"
  {
    models: Record<string, ModelSpec>; // model name e.g. "Oppo F1"
  }
>;

export const deviceCatalog: BrandCatalog = {
  Apple: {
    models: {
      "iPhone 7": {
        storage: ["32GB", "128GB", "256GB"],
        ram: ["2GB"],
        colors: [
          { label: "Black", hex: "#1F2020" },
          { label: "Jet Black", hex: "#1C1B1E" },
          { label: "Silver", hex: "#E4E4E2" },
          { label: "Gold", hex: "#FADCC2" },
          { label: "Rose Gold", hex: "#F7DDD5" },
          { label: "Product Red", hex: "#BF0013" },
        ],
      },
      "iPhone 7 Plus": {
        storage: ["32GB", "128GB", "256GB"],
        ram: ["3GB"],
        colors: [
          { label: "Black", hex: "#1F2020" },
          { label: "Jet Black", hex: "#1C1B1E" },
          { label: "Silver", hex: "#E4E4E2" },
          { label: "Gold", hex: "#FADCC2" },
          { label: "Rose Gold", hex: "#F7DDD5" },
          { label: "Product Red", hex: "#BF0013" },
        ],
      },
      "iPhone SE (1st generation)": {
        storage: ["16GB", "32GB", "64GB", "128GB"],
        ram: ["2GB"],
        colors: [
          { label: "Space Grey", hex: "#272729" },
          { label: "Silver", hex: "#E4E4E2" },
          { label: "Gold", hex: "#FADCC2" },
          { label: "Rose Gold", hex: "#F7DDD5" },
        ],
      },
      "iPhone 8": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["2GB"],
        colors: [
          { label: "Space Grey", hex: "#272729" }, // from Apple CSS
          { label: "Silver", hex: "#E2E3E4" }, // from Apple CSS
          { label: "Gold", hex: "#F7E8DD" }, // from Apple CSS
          { label: "Product Red", hex: "#960111" }, // from Apple CSS
        ],
      },
      "iPhone 8 Plus": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["3GB"],
        colors: [
          { label: "Space Grey", hex: "#272729" },
          { label: "Silver", hex: "#E2E3E4" },
          { label: "Gold", hex: "#F7E8DD" },
          { label: "Product Red", hex: "#960111" },
        ],
      },
      "iPhone X": {
        storage: ["64GB", "256GB"],
        ram: ["3GB"],
        colors: [
          { label: "Space Grey", hex: "#262529" }, // from Apple CSS
          { label: "Silver", hex: "#E4E4E2" }, // from Apple CSS
        ],
      },
      "iPhone XR": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["3GB"],
        colors: [
          { label: "Black", hex: "#2E3034" },
          { label: "White", hex: "#F3F3F3" },
          { label: "Blue", hex: "#48AEE6" },
          { label: "Yellow", hex: "#F9D045" },
          { label: "Coral", hex: "#FF6E5A" },
          { label: "Product Red", hex: "#B41325" },
        ],
      },
      "iPhone XS": {
        storage: ["64GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Space Grey", hex: "#262529" },
          { label: "Silver", hex: "#E4E4E2" },
          { label: "Gold", hex: "#FADCC2" },
        ],
      },
      "iPhone XS Max": {
        storage: ["64GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Space Grey", hex: "#262529" },
          { label: "Silver", hex: "#E4E4E2" },
          { label: "Gold", hex: "#FADCC2" },
        ],
      },
      "iPhone 11": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#1F2020" },
          { label: "White", hex: "#F9F6EF" },
          { label: "Green", hex: "#AEE1CD" },
          { label: "Yellow", hex: "#FFE681" },
          { label: "Purple", hex: "#D1CDDA" },
          { label: "Product Red", hex: "#BA0C2E" },
        ],
      },
      "iPhone 11 Pro": {
        storage: ["64GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Green", hex: "#4E5851" },
          { label: "Space Grey", hex: "#535150" },
          { label: "Silver", hex: "#EBEBE3" },
          { label: "Gold", hex: "#FAD7BD" },
        ],
      },
      "iPhone 11 Pro Max": {
        storage: ["64GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Green", hex: "#4E5851" },
          { label: "Space Grey", hex: "#535150" },
          { label: "Silver", hex: "#EBEBE3" },
          { label: "Gold", hex: "#FAD7BD" },
        ],
      },
      "iPhone SE (2nd generation)": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["3GB"],
        colors: [
          { label: "Black", hex: "#262529" },
          { label: "White", hex: "#F3F3F3" },
          { label: "Product Red", hex: "#B41325" },
        ],
      },
      "iPhone 12 mini": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#25212B" },
          { label: "White", hex: "#F6F2EF" },
          { label: "Green", hex: "#D8EFD5" },
          { label: "Blue", hex: "#023B63" },
          { label: "Purple", hex: "#B7AFE6" },
          { label: "Product Red", hex: "#D82E2E" },
        ],
      },
      "iPhone 12": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#25212B" },
          { label: "White", hex: "#F6F2EF" },
          { label: "Green", hex: "#D8EFD5" },
          { label: "Blue", hex: "#023B63" },
          { label: "Purple", hex: "#B7AFE6" },
          { label: "Product Red", hex: "#D82E2E" },
        ],
      },
      "iPhone 12 Pro": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite", hex: "#52514D" },
          { label: "Silver", hex: "#E3E4DF" },
          { label: "Gold", hex: "#FCEBD3" },
          { label: "Pacific Blue", hex: "#2D4E5C" },
        ],
      },
      "iPhone 12 Pro Max": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite", hex: "#52514D" },
          { label: "Silver", hex: "#E3E4DF" },
          { label: "Gold", hex: "#FCEBD3" },
          { label: "Pacific Blue", hex: "#2D4E5C" },
        ],
      },
      "iPhone 13 mini": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight", hex: "#232A31" },
          { label: "Starlight", hex: "#FAF6F2" },
          { label: "Blue", hex: "#276787" },
          { label: "Pink", hex: "#FADDD7" },
          { label: "Green", hex: "#394C38" },
          { label: "Product Red", hex: "#BF0013" },
        ],
      },
      "iPhone 13": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight", hex: "#232A31" },
          { label: "Starlight", hex: "#FAF6F2" },
          { label: "Blue", hex: "#276787" },
          { label: "Pink", hex: "#FADDD7" },
          { label: "Green", hex: "#394C38" },
          { label: "Product Red", hex: "#BF0013" },
        ],
      },
      "iPhone 13 Pro": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite", hex: "#54524F" },
          { label: "Gold", hex: "#FAE7CF" },
          { label: "Silver", hex: "#F1F2ED" },
          { label: "Sierra Blue", hex: "#A7C1D9" },
          { label: "Alpine Green", hex: "#576856" },
        ],
      },
      "iPhone 13 Pro Max": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite", hex: "#54524F" },
          { label: "Gold", hex: "#FAE7CF" },
          { label: "Silver", hex: "#F1F2ED" },
          { label: "Sierra Blue", hex: "#A7C1D9" },
          { label: "Alpine Green", hex: "#576856" },
        ],
      },
      "iPhone 14": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Midnight", hex: "#222930" },
          { label: "Starlight", hex: "#FAF6F2" },
          { label: "Purple", hex: "#E6DDEB" },
          { label: "Yellow", hex: "#F9E479" },
          { label: "Blue", hex: "#A0B4C7" },
          { label: "Product Red", hex: "#FC0324" },
        ],
      },
      "iPhone 14 Plus": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Midnight", hex: "#222930" },
          { label: "Starlight", hex: "#FAF6F2" },
          { label: "Purple", hex: "#E6DDEB" },
          { label: "Yellow", hex: "#F9E479" },
          { label: "Blue", hex: "#A0B4C7" },
          { label: "Product Red", hex: "#FC0324" },
        ],
      },
      "iPhone 14 Pro": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["6GB"],
        colors: [
          { label: "Space Black", hex: "#403E3D" },
          { label: "Silver", hex: "#F0F2F2" },
          { label: "Gold", hex: "#F4E8CE" },
          { label: "Deep Purple", hex: "#594F63" },
        ],
      },
      "iPhone 14 Pro Max": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["6GB"],
        colors: [
          { label: "Space Black", hex: "#403E3D" },
          { label: "Silver", hex: "#F0F2F2" },
          { label: "Gold", hex: "#F4E8CE" },
          { label: "Deep Purple", hex: "#594F63" },
        ],
      },
      "iPhone SE (3rd generation)": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight", hex: "#232A31" },
          { label: "Starlight", hex: "#FAF6F2" },
          { label: "Product Red", hex: "#BF0013" },
        ],
      },
      "iPhone 15": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Black", hex: "#35393B" },
          { label: "White", hex: "#F5F5F5" },
          { label: "Yellow", hex: "#E5E0C1" },
          { label: "Green", hex: "#CAD4C5" },
          { label: "Blue", hex: "#CED5D9" },
          { label: "Pink", hex: "#E3C8CA" },
        ],
      },
      "iPhone 15 Plus": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["6GB"],
        colors: [
          { label: "Black", hex: "#35393B" },
          { label: "White", hex: "#F5F5F5" },
          { label: "Yellow", hex: "#E5E0C1" },
          { label: "Green", hex: "#CAD4C5" },
          { label: "Blue", hex: "#CED5D9" },
          { label: "Pink", hex: "#E3C8CA" },
        ],
      },
      "iPhone 15 Pro": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["8GB"],
        colors: [
          { label: "Black Titanium", hex: "#1B1B1B" },
          { label: "White Titanium", hex: "#DDDDDD" },
          { label: "Blue Titanium", hex: "#2F4452" },
          { label: "Natural Titanium", hex: "#837F7D" },
        ],
      },
      "iPhone 15 Pro Max": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["8GB"],
        colors: [
          { label: "Black Titanium", hex: "#1B1B1B" },
          { label: "White Titanium", hex: "#DDDDDD" },
          { label: "Blue Titanium", hex: "#2F4452" },
          { label: "Natural Titanium", hex: "#837F7D" },
        ],
      },
      "iPhone 16": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#3C4042" },
          { label: "White", hex: "#FAFAFA" },
          { label: "Pink", hex: "#F2ADDA" },
          { label: "Teal", hex: "#B0D4D2" },
          { label: "Ultramarine", hex: "#9AADF6" },
        ],
      },
      "iPhone 16 Plus": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#3C4042" },
          { label: "White", hex: "#FAFAFA" },
          { label: "Pink", hex: "#F2ADDA" },
          { label: "Teal", hex: "#B0D4D2" },
          { label: "Ultramarine", hex: "#9AADF6" },
        ],
      },
      "iPhone 16 Pro": {
        storage: ["128GB", "256GB", "512GB", "1TB"],
        ram: ["8GB"],
        colors: [
          { label: "Black Titanium", hex: "#3C3C3D" }, // from Apple CSS
          { label: "White Titanium", hex: "#F2F1ED" }, // from Apple CSS
          { label: "Natural Titanium", hex: "#C2BCB2" }, // from Apple CSS
          { label: "Desert Titanium", hex: "#BFA48F" }, // from Apple CSS
        ],
      },
      "iPhone 16 Pro Max": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["8GB"],
        colors: [
          { label: "Black Titanium", hex: "#3C3C3D" },
          { label: "White Titanium", hex: "#F2F1ED" },
          { label: "Natural Titanium", hex: "#C2BCB2" },
          { label: "Desert Titanium", hex: "#BFA48F" },
        ],
      },
      "iPhone 17": {
        storage: ["256GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#353839" },
          { label: "Lavender", hex: "#DFCEEA" },
          { label: "Mist Blue", hex: "#96AED1" },
          { label: "Sage", hex: "#A9B689" },
          { label: "White", hex: "#F5F5F5" },
        ],
      },
      "iPhone 17 Air": {
        storage: ["256GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Sky Blue", hex: "#F0F9FF" }, // from Apple CSS
          { label: "Light Gold", hex: "#FFFCF5" }, // from Apple CSS
          { label: "Space Black", hex: "#000000" }, // from Apple CSS
          { label: "Cloud White", hex: "#FCFCFC" }, // from Apple CSS
        ],
      },
      "iPhone 17 Pro": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB"],
        colors: [
          { label: "Deep Blue", hex: "#32374A" }, // from Apple CSS
          { label: "Cosmic Orange", hex: "#F77E2D" }, // from Apple CSS
          { label: "Silver", hex: "#F5F5F5" }, // from Apple CSS
        ],
      },
      "iPhone 17 Pro Max": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB"],
        colors: [
          { label: "Deep Blue", hex: "#32374A" },
          { label: "Cosmic Orange", hex: "#F77E2D" },
          { label: "Silver", hex: "#F5F5F5" },
        ],
      },
    },
  },
  Samsung: {
    models: {
      // ── Galaxy S Series ────────────────────────────────────────────────────

      "Galaxy S7": {
        storage: ["32GB", "64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black Onyx", hex: "#1C1C1C" },
          { label: "Silver Titanium", hex: "#C4C4C4" },
          { label: "Gold Platinum", hex: "#C9B97A" },
          { label: "Blue Coral", hex: "#5B8EA6" },
        ],
      },
      "Galaxy S7 edge": {
        storage: ["32GB", "64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black Onyx", hex: "#1C1C1C" },
          { label: "Silver Titanium", hex: "#C4C4C4" },
          { label: "Gold Platinum", hex: "#C9B97A" },
          { label: "Blue Coral", hex: "#5B8EA6" },
        ],
      },
      // S8 had 5 colors; original was missing Arctic Silver and Coral Blue
      "Galaxy S8": {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Maple Gold", hex: "#C5A87C" },
          { label: "Orchid Gray", hex: "#BAB0C0" },
          { label: "Arctic Silver", hex: "#C8C8C8" },
          { label: "Coral Blue", hex: "#6590A8" },
        ],
      },
      "Galaxy S8+": {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Maple Gold", hex: "#C5A87C" },
          { label: "Orchid Gray", hex: "#BAB0C0" },
          { label: "Arctic Silver", hex: "#C8C8C8" },
          { label: "Coral Blue", hex: "#6590A8" },
        ],
      },
      // S9: color was "Lilac Purple" not "Lilac Gray"; Ice Blue was a regional color
      "Galaxy S9": {
        storage: ["64GB", "128GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Coral Blue", hex: "#596C8C" },
          { label: "Lilac Purple", hex: "#8F6A8C" },
          { label: "Sunrise Gold", hex: "#BF957F" },
          { label: "Ice Blue", hex: "#A8BECF" },
        ],
      },
      "Galaxy S9+": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["6GB"],
        colors: [
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Coral Blue", hex: "#596C8C" },
          { label: "Lilac Purple", hex: "#8F6A8C" },
          { label: "Sunrise Gold", hex: "#BF957F" },
          { label: "Ice Blue", hex: "#A8BECF" },
        ],
      },
      // S10e also had Canary Yellow and Flamingo Pink (missing from original)
      "Galaxy S10e": {
        storage: ["128GB", "256GB"],
        ram: ["6GB"],
        colors: [
          { label: "Prism White", hex: "#F0EDE8" },
          { label: "Prism Black", hex: "#2A2A2C" },
          { label: "Prism Green", hex: "#B8D4C4" },
          { label: "Prism Blue", hex: "#7090B0" },
          { label: "Canary Yellow", hex: "#E8D870" },
          { label: "Flamingo Pink", hex: "#E8B0B0" },
        ],
      },
      // S10 also had Flamingo Pink and Cardinal Red (missing from original)
      "Galaxy S10": {
        storage: ["128GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Prism White", hex: "#F0EDE8" },
          { label: "Prism Black", hex: "#2A2A2C" },
          { label: "Prism Green", hex: "#B8D4C4" },
          { label: "Prism Blue", hex: "#7090B0" },
          { label: "Cardinal Red", hex: "#7A1A20" },
          { label: "Flamingo Pink", hex: "#E8B0B0" },
        ],
      },
      "Galaxy S10+": {
        storage: ["128GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Prism White", hex: "#F0EDE8" },
          { label: "Prism Black", hex: "#2A2A2C" },
          { label: "Prism Green", hex: "#B8D4C4" },
          { label: "Prism Blue", hex: "#7090B0" },
          { label: "Cardinal Red", hex: "#7A1A20" },
          { label: "Ceramic White", hex: "#F8F8F8" },
          { label: "Ceramic Black", hex: "#1A1A1A" },
        ],
      },
      "Galaxy S10 5G": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Crown Silver", hex: "#C8C8C4" },
          { label: "Majestic Black", hex: "#1A1A1C" },
          { label: "Royal Gold", hex: "#C0A870" },
        ],
      },
      "Galaxy S20": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Cosmic Grey", hex: "#9A9A9C" },
          { label: "Cosmic Black", hex: "#1A1A1C" },
          { label: "Cloud Blue", hex: "#AABCCC" },
          { label: "Cloud Pink", hex: "#E8C0C8" },
          { label: "Cloud White", hex: "#F8F8F0" },
        ],
      },
      "Galaxy S20+": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Cosmic Grey", hex: "#9A9A9C" },
          { label: "Cosmic Black", hex: "#1A1A1C" },
          { label: "Cloud Blue", hex: "#AABCCC" },
          { label: "Cloud Pink", hex: "#E8C0C8" },
          { label: "Cloud White", hex: "#F8F8F0" },
        ],
      },
      // S20 Ultra had only 2 colors: Cosmic Black and Cosmic Grey — "Aura Red" never existed on this model
      "Galaxy S20 Ultra": {
        storage: ["128GB", "256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#1A1A1C" },
          { label: "Cosmic Grey", hex: "#9A9A9C" },
        ],
      },
      "Galaxy S20 FE": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Cloud White", hex: "#F8F8F0" },
          { label: "Cloud Blue", hex: "#AABCCC" },
          { label: "Cloud Red", hex: "#C03830" },
          { label: "Cloud Lavender", hex: "#D4C0D8" },
          { label: "Cloud Mint", hex: "#A8CCC0" },
          { label: "Cloud Navy", hex: "#2A3848" },
          { label: "Cloud Orange", hex: "#E89060" },
        ],
      },
      // S21 had 5 colors: Phantom Gray, White, Violet, Pink, Black — original missed Pink and Black
      "Galaxy S21": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Gray", hex: "#4A4C50" },
          { label: "Phantom White", hex: "#F0F0EE" },
          { label: "Phantom Violet", hex: "#9070A8" },
          { label: "Phantom Pink", hex: "#D8A8B8" },
          { label: "Phantom Black", hex: "#1A1A1C" },
        ],
      },
      // S21+ standard: Phantom Black, Phantom Silver, Phantom Violet
      "Galaxy S21+": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom Silver", hex: "#C8C8C8" },
          { label: "Phantom Violet", hex: "#9070A8" },
        ],
      },
      "Galaxy S21 Ultra": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom Silver", hex: "#C8C8C8" },
          { label: "Phantom Titanium", hex: "#8A8A8C" },
          { label: "Phantom Navy", hex: "#2A3A50" },
          { label: "Phantom Brown", hex: "#7A5A48" },
        ],
      },
      "Galaxy S21 FE": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Olive", hex: "#707A5A" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "White", hex: "#F0F0EE" },
        ],
      },
      // S22/S22+ had up to 8 colors across standard + exclusives
      "Galaxy S22": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom White", hex: "#F0F0EE" },
          { label: "Green", hex: "#405848" },
          { label: "Pink Gold", hex: "#C8A090" },
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Bora Purple", hex: "#7058A0" },
          { label: "Sky Blue", hex: "#A0B8D0" },
        ],
      },
      "Galaxy S22+": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom White", hex: "#F0F0EE" },
          { label: "Green", hex: "#405848" },
          { label: "Pink Gold", hex: "#C8A090" },
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Bora Purple", hex: "#7058A0" },
          { label: "Sky Blue", hex: "#A0B8D0" },
        ],
      },
      "Galaxy S22 Ultra": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom White", hex: "#F0F0EE" },
          { label: "Burgundy", hex: "#6A2030" },
          { label: "Green", hex: "#405848" },
          { label: "Sky Blue", hex: "#A0B8D0" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy S23": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Green", hex: "#405848" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "Lime", hex: "#D0D898" },
          { label: "Sky Blue", hex: "#A0B8D0" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy S23+": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Green", hex: "#405848" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "Lime", hex: "#D0D898" },
          { label: "Sky Blue", hex: "#A0B8D0" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy S23 Ultra": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Green", hex: "#405848" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "Sky Blue", hex: "#A0B8D0" },
          { label: "Lime", hex: "#D0D898" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy S23 FE": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Indigo", hex: "#404878" },
          { label: "Tangerine", hex: "#D87040" },
        ],
      },
      // S24: Onyx Black, Marble Gray, Cobalt Violet, Amber Yellow — original had wrong names/colors
      "Galaxy S24": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Onyx Black", hex: "#2E2E30" },
          { label: "Marble Gray", hex: "#D0CEC8" },
          { label: "Cobalt Violet", hex: "#6858A0" },
          { label: "Amber Yellow", hex: "#D8C870" },
        ],
      },
      "Galaxy S24+": {
        storage: ["256GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Onyx Black", hex: "#2E2E30" },
          { label: "Marble Gray", hex: "#D0CEC8" },
          { label: "Cobalt Violet", hex: "#6858A0" },
          { label: "Amber Yellow", hex: "#D8C870" },
        ],
      },
      // S24 Ultra: Titanium Black, Titanium Gray, Titanium Violet, Titanium Yellow
      "Galaxy S24 Ultra": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB"],
        colors: [
          { label: "Titanium Black", hex: "#2A2A2C" },
          { label: "Titanium Gray", hex: "#8A8A8C" },
          { label: "Titanium Violet", hex: "#5A4878" },
          { label: "Titanium Yellow", hex: "#C8B050" },
        ],
      },
      "Galaxy S24 FE": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#5878A0" },
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Gray", hex: "#9A9A9C" },
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Yellow", hex: "#D8C870" },
        ],
      },
      // S25/S25+: Icy Blue, Mint, Navy, Silver Shadow — original had completely wrong colors
      "Galaxy S25": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Icy Blue", hex: "#C0D0DC" },
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Navy", hex: "#283448" },
          { label: "Silver Shadow", hex: "#B8B8BC" },
        ],
      },
      "Galaxy S25+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Icy Blue", hex: "#C0D0DC" },
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Navy", hex: "#283448" },
          { label: "Silver Shadow", hex: "#B8B8BC" },
        ],
      },
      // S25 Ultra: Titanium Black, Titanium Silver Blue, Titanium White Silver, Titanium Gray
      "Galaxy S25 Ultra": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB"],
        colors: [
          { label: "Titanium Black", hex: "#2A2A2C" },
          { label: "Titanium Silver Blue", hex: "#A8B8C8" },
          { label: "Titanium White Silver", hex: "#E8E8E4" },
          { label: "Titanium Gray", hex: "#8A8A8C" },
        ],
      },
      // S25 Edge: NEW MODEL — missing from original
      "Galaxy S25 Edge": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Titanium Icy Blue", hex: "#A8C0D0" },
          { label: "Titanium Silver", hex: "#C8C8C8" },
          { label: "Titanium Jet Black", hex: "#1A1A1C" },
        ],
      },
      // S25 FE: NEW MODEL — missing from original; Jet Black, Icy Blue, Navy, White
      "Galaxy S25 FE": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Jet Black", hex: "#1A1A1C" },
          { label: "Icy Blue", hex: "#B8CCD8" },
          { label: "Navy", hex: "#283448" },
          { label: "White", hex: "#F8F8F8" },
        ],
      },
      // S26/S26+/S26 Ultra: all 4 share Black, White, Sky Blue, Cobalt Violet — original had wrong colors
      "Galaxy S26": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F8F8F8" },
          { label: "Sky Blue", hex: "#A8C0D8" },
          { label: "Cobalt Violet", hex: "#504080" },
        ],
      },
      "Galaxy S26+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F8F8F8" },
          { label: "Sky Blue", hex: "#A8C0D8" },
          { label: "Cobalt Violet", hex: "#504080" },
        ],
      },
      "Galaxy S26 Ultra": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F8F8F8" },
          { label: "Sky Blue", hex: "#A8C0D8" },
          { label: "Cobalt Violet", hex: "#504080" },
        ],
      },

      // ── Galaxy Note Series ─────────────────────────────────────────────────

      "Galaxy Note8": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["6GB"],
        colors: [
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Maple Gold", hex: "#C5A87C" },
          { label: "Deepsea Blue", hex: "#1E2E58" },
          { label: "Orchid Gray", hex: "#BAB0C0" },
        ],
      },
      // Note9: had 5 colors — original was missing Midnight Black and Cloud Silver
      "Galaxy Note9": {
        storage: ["128GB", "512GB"],
        ram: ["8GB"],
        colors: [
          { label: "Ocean Blue", hex: "#3A5878" },
          { label: "Lavender Purple", hex: "#8A68A8" },
          { label: "Metallic Copper", hex: "#B87848" },
          { label: "Midnight Black", hex: "#1C1C1C" },
          { label: "Cloud Silver", hex: "#C8C8C8" },
        ],
      },
      "Galaxy Note10": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Aura Glow", hex: "#D8D4D0" },
          { label: "Aura White", hex: "#F0EEE8" },
          { label: "Aura Black", hex: "#1A1A1C" },
          { label: "Aura Red", hex: "#8A2020" },
          { label: "Aura Pink", hex: "#D8A8B0" },
        ],
      },
      "Galaxy Note10+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Aura Glow", hex: "#D8D4D0" },
          { label: "Aura White", hex: "#F0EEE8" },
          { label: "Aura Black", hex: "#1A1A1C" },
          { label: "Aura Red", hex: "#8A2020" },
          { label: "Aura Blue", hex: "#3858A0" },
        ],
      },
      // Note20: had 4 colors — original was missing Mystic Green and Mystic White
      "Galaxy Note20": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Gray", hex: "#6E6E70" },
          { label: "Mystic Bronze", hex: "#8A6248" },
          { label: "Mystic Green", hex: "#3A5040" },
          { label: "Mystic White", hex: "#F0EEE8" },
        ],
      },
      "Galaxy Note20 Ultra": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Mystic Black", hex: "#1A1A1C" },
          { label: "Mystic White", hex: "#F0EEE8" },
          { label: "Mystic Bronze", hex: "#8A6248" },
          { label: "Mystic Red", hex: "#882030" },
          { label: "Mystic Blue", hex: "#3050A0" },
        ],
      },

      // ── Galaxy Z Fold Series ───────────────────────────────────────────────

      "Galaxy Z Fold3": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Phantom Green", hex: "#3A5040" },
          { label: "Phantom Silver", hex: "#C8C8C8" },
        ],
      },
      "Galaxy Z Fold4": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Burgundy", hex: "#6A2030" },
          { label: "Gray Green", hex: "#687870" },
          { label: "Beige", hex: "#E8E0C8" },
        ],
      },
      "Galaxy Z Fold5": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Icy Blue", hex: "#B8CCD8" },
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Cream", hex: "#EEE8D8" },
        ],
      },
      // Z Fold6: Silver Shadow, Pink, Navy — original had wrong colors (Midnight/Silver/Coral)
      "Galaxy Z Fold6": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Silver Shadow", hex: "#B8B8BC" },
          { label: "Pink", hex: "#E8C0C8" },
          { label: "Navy", hex: "#283448" },
        ],
      },
      // Z Fold7: Blue Shadow, Jet Black, Silver Shadow — original had wrong colors (Onyx/Frosty White/Sapphire Blue)
      "Galaxy Z Fold7": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB"],
        colors: [
          { label: "Blue Shadow", hex: "#3A5878" },
          { label: "Jet Black", hex: "#1A1A1C" },
          { label: "Silver Shadow", hex: "#B8B8BC" },
        ],
      },

      // ── Galaxy Z Flip Series ───────────────────────────────────────────────

      "Galaxy Z Flip3": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Phantom Black", hex: "#1A1A1C" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Lavender", hex: "#C0B0D8" },
          { label: "Green", hex: "#3A5040" },
          { label: "Pink", hex: "#D8A8B8" },
          { label: "White", hex: "#F0F0EE" },
          { label: "Gray", hex: "#6E6E70" },
        ],
      },
      "Galaxy Z Flip4": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Bora Purple", hex: "#7058A0" },
          { label: "Pink Gold", hex: "#D8A898" },
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Blue", hex: "#4870A0" },
        ],
      },
      "Galaxy Z Flip5": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Cream", hex: "#EEE8D8" },
          { label: "Lavender", hex: "#C0B0D8" },
        ],
      },
      // Z Flip6: Blue, Mint, Silver Shadow, Yellow — original had wrong colors (Coral/Blue/Black)
      "Galaxy Z Flip6": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#4870A0" },
          { label: "Mint", hex: "#A8CCC0" },
          { label: "Silver Shadow", hex: "#B8B8BC" },
          { label: "Yellow", hex: "#D8C870" },
        ],
      },
      // Z Flip7: Blue Shadow, Jet Black, Coral Red — original had wrong colors (Sky Blue/Coral/White)
      "Galaxy Z Flip7": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Blue Shadow", hex: "#3A5878" },
          { label: "Jet Black", hex: "#1A1A1C" },
          { label: "Coral Red", hex: "#C84848" },
        ],
      },
      // Z Flip7 FE: NEW MODEL — missing from original
      "Galaxy Z Flip7 FE": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F8F8F8" },
        ],
      },

      // ── Galaxy A Series ────────────────────────────────────────────────────

      "Galaxy A5 (2016)": {
        storage: ["16GB", "32GB"],
        ram: ["2GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Gold", hex: "#C8A870" },
          { label: "Silver", hex: "#C8C8C8" },
          { label: "White", hex: "#F0F0EE" },
          { label: "Pink", hex: "#D8A8B8" },
        ],
      },
      "Galaxy A7 (2016)": {
        storage: ["16GB", "32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Gold", hex: "#C8A870" },
          { label: "Silver", hex: "#C8C8C8" },
          { label: "White", hex: "#F0F0EE" },
        ],
      },
      "Galaxy A5 (2017)": {
        storage: ["32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Peach Cloud", hex: "#E8C0A8" },
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Blue Mist", hex: "#9090C0" },
          { label: "Gold Sand", hex: "#D8C090" },
          { label: "Orchid Gray", hex: "#BAB0C0" },
        ],
      },
      "Galaxy A7 (2017)": {
        storage: ["32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Peach Cloud", hex: "#E8C0A8" },
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Blue Mist", hex: "#9090C0" },
          { label: "Gold Sand", hex: "#D8C090" },
        ],
      },
      "Galaxy A8 (2018)": {
        storage: ["32GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Orchid Gray", hex: "#BAB0C0" },
          { label: "Gold", hex: "#C8A870" },
          { label: "Blue", hex: "#4870A0" },
        ],
      },
      "Galaxy A9 (2018)": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Caviar Black", hex: "#1A1A1C" },
          { label: "Lemonade Blue", hex: "#78A8D0" },
          { label: "Bubblegum Pink", hex: "#E8A0B8" },
        ],
      },
      "Galaxy A50": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F0F0EE" },
          { label: "Blue", hex: "#4870A0" },
          { label: "Coral", hex: "#E08070" },
        ],
      },
      "Galaxy A50s": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Prism Crush Black", hex: "#1A1A1C" },
          { label: "Prism Crush White", hex: "#F0F0EE" },
          { label: "Prism Crush Violet", hex: "#9070B0" },
        ],
      },
      "Galaxy A70": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F0F0EE" },
          { label: "Blue", hex: "#4870A0" },
          { label: "Coral", hex: "#E08070" },
        ],
      },
      "Galaxy A80": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Angel Gold", hex: "#D8C080" },
          { label: "Ghost White", hex: "#F8F8F8" },
          { label: "Phantom Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy A51": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Prism Crush Black", hex: "#1A1A1C" },
          { label: "Prism Crush White", hex: "#F0F0EE" },
          { label: "Prism Crush Blue", hex: "#4870A0" },
          { label: "Prism Crush Pink", hex: "#E8A0B8" },
        ],
      },
      "Galaxy A51 5G": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Prism Cube Black", hex: "#1A1A1C" },
          { label: "Prism Cube White", hex: "#F0F0EE" },
          { label: "Prism Cube Blue", hex: "#4870A0" },
          { label: "Prism Cube Pink", hex: "#E8A0B8" },
        ],
      },
      "Galaxy A71": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Prism Crush Black", hex: "#1A1A1C" },
          { label: "Prism Crush Silver", hex: "#C8C8C8" },
          { label: "Prism Crush Blue", hex: "#4870A0" },
          { label: "Prism Crush Pink", hex: "#E8A0B8" },
        ],
      },
      "Galaxy A52": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Violet", hex: "#9070B0" },
        ],
      },
      "Galaxy A52s 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Violet", hex: "#9070B0" },
          { label: "Awesome Mint", hex: "#A8CCC0" },
        ],
      },
      "Galaxy A72": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Violet", hex: "#9070B0" },
          { label: "Awesome Blue", hex: "#4870A0" },
        ],
      },
      "Galaxy A53 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Orange", hex: "#D88050" },
          { label: "Awesome Peach", hex: "#E8C0A8" },
        ],
      },
      "Galaxy A33 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Light Green", hex: "#A8C8B0" },
          { label: "Awesome Peach", hex: "#E8C0A8" },
        ],
      },
      // A54 5G: Awesome Black, White, Lime, Violet — original had wrong colors (Iceblue/Blossom Pink/Black)
      "Galaxy A54 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F0F0EE" },
          { label: "Awesome Lime", hex: "#C8D880" },
          { label: "Awesome Violet", hex: "#9070B0" },
        ],
      },
      // A55 5G: Awesome Navy, Awesome Black, Awesome Iceblue, Awesome Lilac — original had wrong colors
      "Galaxy A55 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Awesome Navy", hex: "#283448" },
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome Iceblue", hex: "#B8CCD8" },
          { label: "Awesome Lilac", hex: "#C0B0D8" },
        ],
      },
      "Galaxy A56 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F8F8F8" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Light Green", hex: "#A8C8B0" },
        ],
      },
      "Galaxy A36 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F8F8F8" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Lilac", hex: "#C0B0D8" },
        ],
      },
      "Galaxy A26 5G": {
        storage: ["128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome White", hex: "#F8F8F8" },
          { label: "Awesome Blue", hex: "#4870A0" },
          { label: "Awesome Lilac", hex: "#C0B0D8" },
        ],
      },
      "Galaxy A16 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Gold", hex: "#C8A870" },
          { label: "Light Blue", hex: "#A8C0D8" },
          { label: "Light Green", hex: "#A8C8B0" },
        ],
      },

      // ── Galaxy M Series ────────────────────────────────────────────────────

      "Galaxy M10": {
        storage: ["16GB", "32GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Charcoal Black", hex: "#2A2A2C" },
          { label: "Ocean Blue", hex: "#2A5878" },
        ],
      },
      "Galaxy M20": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Ocean Blue", hex: "#2A5878" },
          { label: "Charcoal Black", hex: "#2A2A2C" },
        ],
      },
      "Galaxy M30": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Gradation Black", hex: "#2A2A2C" },
          { label: "Gradation Blue", hex: "#2A5878" },
        ],
      },
      "Galaxy M40": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Seawater Blue", hex: "#305878" },
          { label: "Midnight Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M10s": {
        storage: ["32GB", "64GB"],
        ram: ["3GB"],
        colors: [
          { label: "Charcoal Black", hex: "#2A2A2C" },
          { label: "Opal Blue", hex: "#80A8C0" },
          { label: "Opal Green", hex: "#80A878" },
        ],
      },
      "Galaxy M30s": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Pearl White", hex: "#F0EEE8" },
          { label: "Sapphire Blue", hex: "#284878" },
          { label: "Opal Black", hex: "#2A2A2C" },
        ],
      },
      "Galaxy M01": {
        storage: ["32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Charcoal Black", hex: "#2A2A2C" },
          { label: "Smoky Blue", hex: "#5A7A9A" },
        ],
      },
      "Galaxy M01s": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Persian Blue", hex: "#2A5A8A" },
          { label: "Soft Pink", hex: "#F0C0C8" },
        ],
      },
      "Galaxy M11": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Metallic Silver", hex: "#C0C0C0" },
          { label: "Charcoal Black", hex: "#2A2A2C" },
        ],
      },
      "Galaxy M21": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Raven Black", hex: "#1A1A1C" },
          { label: "Iceberg Blue", hex: "#90B0C8" },
        ],
      },
      "Galaxy M21s": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Charcoal Black", hex: "#2A2A2C" },
          { label: "Metallic Blue", hex: "#3A6A9A" },
          { label: "Mirage Blue", hex: "#2A4A7A" },
        ],
      },
      "Galaxy M31": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Space Black", hex: "#1A1A1C" },
          { label: "Ocean Blue", hex: "#2A5878" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy M31s": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mirage Black", hex: "#1A1A1C" },
          { label: "Mirage Blue", hex: "#2A4878" },
          { label: "Mirage White", hex: "#F0EEE8" },
        ],
      },
      "Galaxy M51": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mystic Black", hex: "#1A1A1C" },
          { label: "Mystic Silver", hex: "#C8C8C8" },
        ],
      },
      "Galaxy M02s": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M02": {
        storage: ["32GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
          { label: "Gray", hex: "#6E6E70" },
          { label: "Red", hex: "#A02020" },
        ],
      },
      "Galaxy M12": {
        storage: ["32GB", "64GB", "128GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F0F0EE" },
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Green", hex: "#384A38" },
        ],
      },
      "Galaxy M32": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome Blue", hex: "#3A6A9A" },
          { label: "Awesome Violet", hex: "#7A5A9A" },
        ],
      },
      "Galaxy M32 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Awesome Black", hex: "#1A1A1C" },
          { label: "Awesome Blue", hex: "#3A6A9A" },
          { label: "Awesome Violet", hex: "#7A5A9A" },
        ],
      },
      "Galaxy M22 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4C50" },
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Purple", hex: "#9B7EB8" },
        ],
      },
      "Galaxy M52 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Icy Blue", hex: "#B8CCD8" },
          { label: "Black", hex: "#1A1A1C" },
          { label: "White", hex: "#F0F0EE" },
        ],
      },
      "Galaxy M23 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Deep Green", hex: "#283A28" },
          { label: "Pink Gold", hex: "#D8A898" },
          { label: "Light Blue", hex: "#90B0C8" },
        ],
      },
      "Galaxy M33 5G": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Deep Sea Blue", hex: "#2A5878" },
          { label: "Emerald Brown", hex: "#504030" },
          { label: "Brown", hex: "#704830" },
        ],
      },
      "Galaxy M34 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Icy Blue", hex: "#B8CCD8" },
          { label: "Waterfall Blue", hex: "#4878A0" },
        ],
      },
      "Galaxy M13 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Aqua Green", hex: "#50A898" },
          { label: "Stardust Brown", hex: "#605040" },
        ],
      },
      "Galaxy M04 5G": {
        storage: ["64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M14 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Arctic Blue", hex: "#90B0C8" },
          { label: "Berry Blue", hex: "#5060A8" },
          { label: "Smoky Teal", hex: "#384848" },
        ],
      },
      "Galaxy M25 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Deep Sea Blue", hex: "#2A5878" },
          { label: "Haze Purple", hex: "#706090" },
          { label: "Sabrina Blue", hex: "#4060A0" },
        ],
      },
      "Galaxy M35 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1C" },
          { label: "Icy Blue", hex: "#B8CCD8" },
          { label: "Light Violet", hex: "#C0B0D8" },
        ],
      },
      "Galaxy M54 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Blue", hex: "#1E2A40" },
          { label: "Awesome Graphite", hex: "#4A4C50" },
          { label: "Awesome Iceblue", hex: "#B8CCD8" },
        ],
      },
      "Galaxy M55 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M55s 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M56 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M06 5G": {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M16 5G": {
        storage: ["128GB", "256GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M36 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M57 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M67 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M17 5G": {
        storage: ["128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M27 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M37 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M58 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M59 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M69 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M18 5G": {
        storage: ["128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M28 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M38 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Blue", hex: "#3A6A9A" },
          { label: "Black", hex: "#1A1A1C" },
        ],
      },
      "Galaxy M50 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M51 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M53 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M60 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M61 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M62 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M63 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M64 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M65 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M66 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
      "Galaxy M68 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#1A1A1C" },
          { label: "Blue", hex: "#3A6A9A" },
        ],
      },
    },
  },
  Xiaomi: {
    models: {
      "Redmi Note 4": {
        storage: ["16GB", "32GB", "64GB"],
        ram: ["2GB", "3GB", "4GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Silver", hex: "#C8C8C8" },
          { label: "Gold", hex: "#C8A870" },
        ],
      },
      "Redmi Note 5": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Rose Gold", hex: "#E8C0A8" },
        ],
      },
      "Redmi Note 5 Pro": {
        storage: ["64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Gray", hex: "#7A7A7A" },
          { label: "Red", hex: "#C02020" },
        ],
      },
      "Redmi Note 6 Pro": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Rose Gold", hex: "#E8C0A8" },
        ],
      },
      "Redmi Note 7": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Red", hex: "#C02020" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Neptune Blue", hex: "#3A6A9A" },
        ],
      },
      "Redmi Note 7 Pro": {
        storage: ["64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Red", hex: "#C02020" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Neptune Blue", hex: "#3A6A9A" },
        ],
      },
      "Redmi Note 8": {
        storage: ["64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Purple", hex: "#7A5A9A" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Green", hex: "#3A7A5A" },
        ],
      },
      "Redmi Note 8 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Purple", hex: "#7A5A9A" },
          { label: "Blue", hex: "#2A5A9A" },
          { label: "Green", hex: "#3A7A5A" },
        ],
      },
      "Redmi Note 9": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Space Black", hex: "#1A1A1A" },
          { label: "Lake Green", hex: "#5A9A7A" },
          { label: "Interstellar Gray", hex: "#6A6A7A" },
        ],
      },
      "Redmi Note 9 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Aurora Green", hex: "#3A8A7A" },
          { label: "Interstellar Gray", hex: "#6A6A7A" },
        ],
      },
      "Redmi Note 9S / 9 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Aurora Green", hex: "#3A8A7A" },
          { label: "Interstellar Gray", hex: "#6A6A7A" },
          { label: "Ocean Blue", hex: "#1A5A8A" },
        ],
      },
      "Redmi Note 10": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Shadow Black", hex: "#1A1A1A" },
          { label: "Pebble White", hex: "#F0EEE8" },
          { label: "Grape Green", hex: "#5A7A5A" },
          { label: "Ocean Blue", hex: "#1A5A8A" },
        ],
      },
      "Redmi Note 10 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Shadow Black", hex: "#1A1A1A" },
          { label: "Glacier Blue", hex: "#5A8AB0" },
          { label: "Velvet Red", hex: "#8A2030" },
        ],
      },
      "Redmi Note 10S": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Shadow Black", hex: "#1A1A1A" },
          { label: "Frost White", hex: "#F5F5F5" },
        ],
      },
      "Redmi Note 11": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Graphite Gray", hex: "#4A4A4A" },
          { label: "Pebble White", hex: "#F0EEE8" },
          { label: "Ocean Blue", hex: "#1A5A8A" },
        ],
      },
      "Redmi Note 11 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Silver", hex: "#C8C8C8" },
          { label: "Mirror Purple", hex: "#8A70A8" },
        ],
      },
      "Redmi Note 11S": {
        storage: ["64GB", "128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite Gray", hex: "#4A4A4A" },
          { label: "Silver", hex: "#C8C8C8" },
          { label: "Smoke Blue", hex: "#5A7A9A" },
        ],
      },
      "Redmi Note 12": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Ice Blue", hex: "#A8CCE0" },
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi Note 12 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB", "12GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi Note 12S": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      "Redmi Note 12 Pro+": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi Note 13": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Transparent Gray", hex: "#7A7A8A" },
          { label: "Lime Green", hex: "#8AC840" },
          { label: "Midnight Black", hex: "#1A1A1A" },
        ],
      },
      "Redmi Note 13 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Lime Green", hex: "#8AC840" },
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Mint", hex: "#8AC8A8" },
        ],
      },
      "Redmi Note 13 Pro+": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Lime Green", hex: "#8AC840" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      "Redmi Note 14 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Aurora Green", hex: "#3A8A7A" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      "Redmi Note 14 Pro 5G": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Aurora Green", hex: "#3A8A7A" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      "Redmi Note 14 Pro+ 5G": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Aurora Green", hex: "#3A8A7A" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      "Redmi Note 15 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi 9": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Aqua Green", hex: "#5AB8A8" },
          { label: "Storm Blue", hex: "#3A5A8A" },
          { label: "Shadow Black", hex: "#1A1A1A" },
        ],
      },
      "Redmi 10": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Shadow Black", hex: "#1A1A1A" },
          { label: "Ocean Blue", hex: "#1A5A8A" },
        ],
      },
      "Redmi 11 Prime": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1A" },
          { label: "Aqua Green", hex: "#5AB8A8" },
        ],
      },
      "Redmi 12": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Glacier Blue", hex: "#5A8AB0" },
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi 12C": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Midnight Black", hex: "#1A1A1A" },
          { label: "Aqua Green", hex: "#5AB8A8" },
        ],
      },
      "Redmi 13C": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Aqua Green", hex: "#5AB8A8" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      "Redmi 12 Prime": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Aqua Blue", hex: "#5AB8C8" },
        ],
      },
      "Redmi 13C 5G": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Aqua", hex: "#5AB8C8" },
        ],
      },
      "Redmi 14C 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Aqua", hex: "#5AB8C8" },
        ],
      },
      "Redmi A2": {
        storage: ["32GB"],
        ram: ["2GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Sea Blue", hex: "#3A6A8A" },
        ],
      },
      "Redmi A2+": {
        storage: ["32GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Sea Blue", hex: "#3A6A8A" },
        ],
      },
      "Redmi A3": {
        storage: ["32GB", "64GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      "Redmi 14 5G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      "Redmi 14 Pro 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Graphite", hex: "#4A4A4A" },
          { label: "Lime Green", hex: "#8AC840" },
        ],
      },
      "Redmi TWS 3": {
        storage: [],
        ram: [],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "White", hex: "#F5F5F5" },
        ],
      },
      "Mi 9T": {
        storage: ["64GB", "128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite Black", hex: "#2A2A2A" },
          { label: "Ruby Red", hex: "#9A1020" },
        ],
      },
      "Mi 9T Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Carbon Black", hex: "#2A2A2A" },
          { label: "Ruby Red", hex: "#9A1020" },
        ],
      },
      "Mi 10": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Pearl White", hex: "#F5F5EE" },
          { label: "Twilight Grey", hex: "#5A5A6A" },
        ],
      },
      "Mi 11": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Cosmic Black", hex: "#1A1A2A" },
          { label: "Glacier Blue", hex: "#5A8AB0" },
          { label: "Frost Blue", hex: "#A8C8E0" },
        ],
      },
      "Mi 11 Ultra": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Ceramic White", hex: "#F8F8F8" },
          { label: "Ceramic Black", hex: "#2A2A2A" },
        ],
      },
      "Mi 12": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Warm Black", hex: "#2A2020" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      "Mi 13": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Green", hex: "#3A7A5A" },
          { label: "Purple", hex: "#7A5A9A" },
        ],
      },
      "Mi 13 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Green", hex: "#3A7A5A" },
          { label: "White", hex: "#F5F5F5" },
        ],
      },
      "Mi 14": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Moonstone Black", hex: "#2A2A3A" },
          { label: "Winter White", hex: "#F0F0F5" },
        ],
      },
      "Mi 14 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Moonstone Black", hex: "#2A2A3A" },
          { label: "Winter White", hex: "#F0F0F5" },
        ],
      },
      "Mi 15": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Jade Green", hex: "#3A8A6A" },
          { label: "Black", hex: "#1A1A1A" },
        ],
      },
      "Mi 16": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Titanium Gray", hex: "#7A7A7A" },
        ],
      },
      "Redmi K20": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Flame Red", hex: "#C02020" },
          { label: "Ice Blue", hex: "#A8CCE0" },
          { label: "Onyx Black", hex: "#1A1A1A" },
        ],
      },
      "Redmi K20 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Flame Orange", hex: "#D85020" },
          { label: "Glacier Blue", hex: "#5A8AB0" },
          { label: "Carbon Black", hex: "#2A2A2A" },
        ],
      },
      "Redmi K30": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Polar White", hex: "#F0F0F0" },
          { label: "Space Gray", hex: "#5A5A5A" },
          { label: "Deep Purple", hex: "#4A3A6A" },
        ],
      },
      "Redmi K30 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Polar White", hex: "#F0F0F0" },
          { label: "Space Gray", hex: "#5A5A5A" },
          { label: "Deep Purple", hex: "#4A3A6A" },
        ],
      },
      "Redmi K30 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Onyx Black", hex: "#1A1A1A" },
          { label: "Lunar Frost", hex: "#E8EAEC" },
        ],
      },
      "Redmi K30 Ultra / K30S Ultra": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Frosty White", hex: "#F0F0F0" },
        ],
      },
      "Redmi K40": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB", "12GB"],
        colors: [
          { label: "Happy 150", hex: "#5A8AC8" },
          { label: "Youth Edition", hex: "#A8D8C8" },
          { label: "Glow Black", hex: "#1A1A2A" },
        ],
      },
      "Redmi K40 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Aquamarine Blue", hex: "#3A9AAA" },
          { label: "Glow Black", hex: "#1A1A2A" },
        ],
      },
      "Redmi K40 Pro+": {
        storage: ["256GB"],
        ram: ["12GB"],
        colors: [
          { label: "Glow Black", hex: "#1A1A2A" },
          { label: "Aquamarine Blue", hex: "#3A9AAA" },
        ],
      },
      "Redmi K40 Gaming Edition": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Red", hex: "#C02020" },
        ],
      },
      "Redmi K50": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cyber Black", hex: "#1A1A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
          { label: "Storm Green", hex: "#2A5A4A" },
        ],
      },
      "Redmi K50 Pro": {
        storage: ["256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cyber Black", hex: "#1A1A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
          { label: "Storm Green", hex: "#2A5A4A" },
        ],
      },
      "Redmi K50 Gaming": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Red", hex: "#C02020" },
          { label: "Blue", hex: "#2A5A9A" },
        ],
      },
      "Redmi K51": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Blue", hex: "#2A5A9A" },
        ],
      },
      "Redmi K52": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Blue", hex: "#2A5A9A" },
        ],
      },
      "Redmi K53": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#1A1A1A" },
          { label: "Blue", hex: "#2A5A9A" },
        ],
      },
      "Redmi K54": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K55": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K56": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K57": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K58": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K59": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K60": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Meteor Black", hex: "#1A1A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
          { label: "Galaxy White", hex: "#F0F0F5" },
        ],
      },
      "Redmi K60 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Meteor Black", hex: "#1A1A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K60 Ultra": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Carbon Black", hex: "#2A2A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K70": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Carbon Black", hex: "#2A2A2A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
          { label: "Emerald Green", hex: "#2A7A5A" },
        ],
      },
      "Redmi K70 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Carbon Black", hex: "#2A2A2A" },
          { label: "Emerald Green", hex: "#2A7A5A" },
        ],
      },
      "Redmi K80": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Nebula Blue", hex: "#2A4A8A" },
        ],
      },
      "Redmi K80 Pro": {
        storage: ["512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#1A1A1A" },
          { label: "Titanium Gray", hex: "#7A7A7A" },
        ],
      },
    },
  },
  POCO: {
    models: {
      M3: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Cool Blue", hex: "#3A7AB0" },
          { label: "Power Black", hex: "#1A1A1A" },
        ],
      },
      "M4 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Cool Blue", hex: "#3A7AB0" },
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Power White", hex: "#F5F5F5" },
        ],
      },
      M5: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Cool Blue", hex: "#3A7AB0" },
        ],
      },
      "M6 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Hunter Black", hex: "#1A1A1A" },
          { label: "Hunter Blue", hex: "#1A3A6A" },
        ],
      },
      X3: {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Frost Blue", hex: "#A8C8E0" },
          { label: "Shadow Gray", hex: "#5A5A5A" },
        ],
      },
      "X3 NFC": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Frost Blue", hex: "#A8C8E0" },
          { label: "Shadow Gray", hex: "#5A5A5A" },
        ],
      },
      "X4 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Cool Blue", hex: "#3A7AB0" },
          { label: "Power Black", hex: "#1A1A1A" },
        ],
      },
      "X5 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Cool Blue", hex: "#3A7AB0" },
          { label: "Power Black", hex: "#1A1A1A" },
        ],
      },
      X6: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Mint", hex: "#8AC8A8" },
        ],
      },
      "X6 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Mint", hex: "#8AC8A8" },
        ],
      },
      F1: {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["6GB"],
        colors: [
          { label: "Graphite Black", hex: "#2A2A2A" },
          { label: "Steel Blue", hex: "#4A7A9A" },
          { label: "Rosso Red", hex: "#B02020" },
        ],
      },
      "F2 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [{ label: "Gradientshock", hex: "#8A50C8" }],
      },
      F3: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Sharp White", hex: "#F0F0F0" },
          { label: "Night Black", hex: "#1A1A2A" },
        ],
      },
      F4: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Night Black", hex: "#1A1A2A" },
          { label: "Sharp White", hex: "#F0F0F0" },
        ],
      },
      F5: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Frost Blue", hex: "#A8C8E0" },
          { label: "Night Black", hex: "#1A1A2A" },
        ],
      },
      F6: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Frost Blue", hex: "#A8C8E0" },
          { label: "Night Black", hex: "#1A1A2A" },
        ],
      },
      F7: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Frost Blue", hex: "#A8C8E0" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      C31: {
        storage: ["32GB", "64GB"],
        ram: ["2GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Sky Blue", hex: "#7AB0D8" },
        ],
      },
      C51: {
        storage: ["32GB", "64GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Sea Blue", hex: "#3A6A8A" },
        ],
      },
      C55: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      C65: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Mint", hex: "#8AC8A8" },
          { label: "Graphite", hex: "#4A4A4A" },
        ],
      },
      N10: {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Cool Blue", hex: "#3A7AB0" },
        ],
      },
      N12: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Cool Blue", hex: "#3A7AB0" },
        ],
      },
      N15: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Bright Blue", hex: "#3A7AB8" },
        ],
      },
      X10: {
        storage: ["64GB", "128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Cool Blue", hex: "#3A7AB0" },
        ],
      },
      X12: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Frost Blue", hex: "#A8C8E0" },
        ],
      },
      X15: {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Frost Blue", hex: "#A8C8E0" },
        ],
      },
      X20: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Power Black", hex: "#1A1A1A" },
          { label: "Mint", hex: "#8AC8A8" },
        ],
      },
    },
  },
  Oppo: {
    models: {
      "Oppo F1": {
        storage: ["16GB", "32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Ruby Red", hex: "#F57C5F" },
          { label: "Rose Gold", hex: "#FCADE6" },
        ],
      },
      F1s: {
        storage: ["16GB", "32GB"],
        ram: ["3GB"],
        colors: [
          { label: "Matte Black", hex: "#191919" },
          { label: "Rose Gold", hex: "#FCADE6" },
        ],
      },
      F3: {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Gold", hex: "#F5E7D0" },
        ],
      },
      "F3 Plus": {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Gold", hex: "#F5E7D0" },
        ],
      },
      F5: {
        storage: ["32GB", "64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Gold", hex: "#F5E7D0" },
        ],
      },
      F7: {
        storage: ["64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Sunset Red", hex: "#F57C5F" },
          { label: "Solar Red", hex: "#BF0013" },
        ],
      },
      F9: {
        storage: ["64GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Sunset Glow", hex: "#FDD96B" },
          { label: "Twilight Valley", hex: "#437691" },
        ],
      },
      "A5 (2020)": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Dazzling White", hex: "#F2F3F5" },
          { label: "Mysterious Black", hex: "#191919" },
        ],
      },
      A15: {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Glacier White", hex: "#F2F3F5" },
          { label: "Twilight Black", hex: "#191919" },
        ],
      },
      A16: {
        storage: ["32GB", "64GB", "128GB"],
        ram: ["4GB"],
        colors: [
          { label: "Glacier White", hex: "#F2F3F5" },
          { label: "Moonlight Black", hex: "#191919" },
        ],
      },
      A31: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Mystery Black", hex: "#191919" },
          { label: "Retro White", hex: "#F2F3F5" },
        ],
      },
      A53: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Mystery Black", hex: "#191919" },
          { label: "Retro White", hex: "#F2F3F5" },
          { label: "Space Blue", hex: "#437691" },
        ],
      },
      A54: {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Olive Green", hex: "#7E9F88" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      A55: {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Crystal Silver", hex: "#F1F2ED" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      "A74 5G": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Crystal Nebula", hex: "#4C4A46" },
          { label: "Mystic Blue", hex: "#437691" },
        ],
      },
      A93: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Black", hex: "#191919" },
          { label: "Radiant Silver", hex: "#F1F2ED" },
        ],
      },
      A94: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Black", hex: "#191919" },
          { label: "Radiant Silver", hex: "#F1F2ED" },
        ],
      },
      "A56 5G": {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Snow White", hex: "#F2F3F5" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "A58 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Snow White", hex: "#F2F3F5" },
          { label: "Night Black", hex: "#191919" },
        ],
      },
      "Reno 1": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Sunset Pink", hex: "#FAE0D8" },
          { label: "Lunar Blue", hex: "#437691" },
          { label: "Starry Night", hex: "#191919" },
        ],
      },
      "Reno 2": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mist White", hex: "#F2F3F5" },
          { label: "Sky Blue", hex: "#6EC1E4" },
          { label: "Twilight Blue", hex: "#437691" },
        ],
      },
      "Reno 3 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Sigma White", hex: "#F2F3F5" },
          { label: "Ocean Blue", hex: "#6EC1E4" },
        ],
      },
      "Reno 4": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Rack Blue", hex: "#4C4A46" },
          { label: "Moonlight Black", hex: "#191919" },
        ],
      },
      "Reno 5 5G": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Black", hex: "#191919" },
          { label: "Starry Blue", hex: "#437691" },
        ],
      },
      "Reno 6 Pro 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Purple", hex: "#A495B2" },
          { label: "Stellar Black", hex: "#191919" },
        ],
      },
      "Reno 7": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Startrail Black", hex: "#191919" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "Reno 8": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "Reno 9": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Meteor Gray", hex: "#41424C" },
        ],
      },
      "Reno 10": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Reno 15": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Reno 15 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "Reno 15 Pro Max": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Deep Blue", hex: "#1E3D5A" },
        ],
      },
      K1: {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Neon Blue", hex: "#6EC1E4" },
        ],
      },
      K3: {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Starlit Black", hex: "#191919" },
          { label: "Aurora Blue", hex: "#6EC1E4" },
        ],
      },
      K7: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Ink Black", hex: "#191919" },
          { label: "Transparent Blue", hex: "#437691" },
        ],
      },
      K9: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "K10 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Space Black", hex: "#191919" },
        ],
      },
      "K11x 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Space Black", hex: "#191919" },
        ],
      },
      "K12 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Ocean Blue", hex: "#6EC1E4" },
        ],
      },
      "K13 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Find X": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Space Grey", hex: "#41424C" },
          { label: "Cosmic Purple", hex: "#A495B2" },
        ],
      },
      "Find X2": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Glacier Green", hex: "#7E9F88" },
          { label: "Volcanic Black", hex: "#191919" },
        ],
      },
      "Find X2 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Glacier Green", hex: "#7E9F88" },
          { label: "Cerulean Blue", hex: "#1E3D5A" },
        ],
      },
      "Find X3": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Volcanic Black", hex: "#191919" },
          { label: "Cosmic Shimmer", hex: "#4C4A46" },
        ],
      },
      "Find X5": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Gloss Black", hex: "#191919" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Find X5 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Gloss Black", hex: "#191919" },
          { label: "Evergreen", hex: "#7E9F88" },
        ],
      },
      "Find X5 Pro+ 5G": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Evergreen", hex: "#7E9F88" },
        ],
      },
      "Find X6 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Divine Green", hex: "#505E4C" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Find X6 Ultra": {
        storage: ["256GB", "512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Find X7": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Sapphire Blue", hex: "#3E4B69" },
        ],
      },
      "Find X7 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "Find X7 Ultra": {
        storage: ["512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Deep Blue", hex: "#1E3D5A" },
        ],
      },
      "Find X8": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Alpine Green", hex: "#505E4C" },
        ],
      },
      "Find X8 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Find X9": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "Find X9 Pro": {
        storage: ["512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Deep Blue", hex: "#1E3D5A" },
        ],
      },
      "Find N": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Night Black", hex: "#191919" },
          { label: "Moonbeam Silver", hex: "#F1F2ED" },
        ],
      },
      "Find N2": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Rhapsody Blue", hex: "#4C4A46" },
        ],
      },
      "Find N3": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Find N3 Flip": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Coral Red", hex: "#F57C5F" },
        ],
      },
      "F17 Pro": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Metallic Black", hex: "#191919" },
          { label: "Silky Blue", hex: "#6EC1E4" },
        ],
      },
      "F19 Pro+": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Glacier Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      "F19 Pro": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Metallic Black", hex: "#191919" },
          { label: "Silky Blue", hex: "#6EC1E4" },
        ],
      },
      "F21 Pro": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Alpha Black", hex: "#191919" },
          { label: "Moonlit White", hex: "#F2F3F5" },
        ],
      },
      F23: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Flame Orange", hex: "#FDD96B" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      "A77 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Crystal Silver", hex: "#F1F2ED" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      "A78 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Crystal Silver", hex: "#F1F2ED" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      "A97 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Ocean Blue", hex: "#6EC1E4" },
        ],
      },
    },
  },
  Vivo: {
    models: {
      V5: {
        storage: ["32GB"],
        ram: ["4GB"],
        colors: [
          { label: "Gold", hex: "#F5E7D0" },
          { label: "Rose Gold", hex: "#FCADE6" },
        ],
      },
      V5s: {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Gold", hex: "#F5E7D0" },
          { label: "Black", hex: "#191919" },
        ],
      },
      V7: {
        storage: ["32GB", "64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Gold", hex: "#F5E7D0" },
        ],
      },
      V9: {
        storage: ["64GB"],
        ram: ["64GB"],
        colors: [
          { label: "Sunrise Gold", hex: "#FDD96B" },
          { label: "Black", hex: "#191919" },
        ],
      },
      V11i: {
        storage: ["64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Dazzling Blue", hex: "#437691" },
        ],
      },
      Y91: {
        storage: ["32GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      Y93: {
        storage: ["32GB", "64GB"],
        ram: ["4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      Y12: {
        storage: ["32GB", "64GB"],
        ram: ["3GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      Y15: {
        storage: ["32GB", "64GB"],
        ram: ["3GB"],
        colors: [
          { label: "Blue", hex: "#437691" },
          { label: "Black", hex: "#191919" },
        ],
      },
      Y17: {
        storage: ["128GB"],
        ram: ["4GB"],
        colors: [
          { label: "Mirage Blue", hex: "#437691" },
          { label: "Midnight Black", hex: "#191919" },
        ],
      },
      Y19: {
        storage: ["128GB"],
        ram: ["4GB"],
        colors: [
          { label: "Midnight Black", hex: "#191919" },
          { label: "Glacier Blue", hex: "#437691" },
        ],
      },
      Y20: {
        storage: ["32GB", "64GB"],
        ram: ["3GB"],
        colors: [
          {
            label: "Glacier Blue",
            hex: "#437691",
          },
          { label: "Midnight Black", hex: "#191919" },
        ],
      },
      Y20s: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      Y21: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Marvel Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      Y21s: {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      Y30: {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Midnight Black", hex: "#191919" },
          { label: "Mirage Blue", hex: "#437691" },
        ],
      },
      Y31: {
        storage: ["128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Glacier Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      "Y51 5G": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Glacier Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      Y53s: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Starlight Black", hex: "#191919" },
          { label: "Stellar Blue", hex: "#4C4A46" },
        ],
      },
      Y73: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "Y76 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      Y100: {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Myst Shock", hex: "#4C4A46" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      Y200: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Black", hex: "#191919" },
          { label: "Mystic Blue", hex: "#437691" },
        ],
      },
      Y27: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Mystic Black", hex: "#191919" },
          { label: "Mystic Blue", hex: "#437691" },
        ],
      },
      V15: {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Royal Blue", hex: "#437691" },
          { label: "Phoenix Red", hex: "#BF0013" },
        ],
      },
      "V17 Pro": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Midnight Black", hex: "#191919" },
          { label: "Mirror Blue", hex: "#437691" },
        ],
      },
      V19: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Magnet Black", hex: "#191919" },
          { label: "Crystal Blue", hex: "#4C4A46" },
        ],
      },
      V21: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Glamour Black", hex: "#191919" },
          { label: "Swan Lake Blue", hex: "#6EC1E4" },
        ],
      },
      V21e: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Onyx Black", hex: "#191919" },
          { label: "Twin Tone Blue", hex: "#4C4A46" },
        ],
      },
      V23: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Diamond Galaxy Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      V25: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Desert Black", hex: "#191919" },
          { label: "Forest Blue", hex: "#437691" },
        ],
      },
      V27: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Desert Black", hex: "#191919" },
          { label: "Forest Blue", hex: "#437691" },
        ],
      },
      V29: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Starry Blue", hex: "#4C4A46" },
        ],
      },
      V30: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Starry Blue", hex: "#4C4A46" },
        ],
      },
      "V30 Lite 5G": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Silver", hex: "#F1F2ED" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      V50: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Starry Blue", hex: "#4C4A46" },
        ],
      },
      "V60 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Mystic Blue", hex: "#437691" },
          { label: "Mystic Black", hex: "#191919" },
        ],
      },
      "V70 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Starry Black", hex: "#191919" },
          { label: "Cosmic Blue", hex: "#437691" },
        ],
      },
      X21: {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Phantom Blue", hex: "#4C4A46" },
          { label: "Ink Blue", hex: "#437691" },
        ],
      },
      "X21 UD": {
        storage: ["128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Starry Diamond Blue", hex: "#4C4A46" },
          { label: "Phantom Blue", hex: "#437691" },
        ],
      },
      X23: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Sunrise Fairy", hex: "#FDD96B" },
          { label: "Starry Night", hex: "#191919" },
        ],
      },
      X27: {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Lunar Blue", hex: "#4C4A46" },
          { label: "Starry Night", hex: "#191919" },
        ],
      },
      "X27 Pro": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Starry Night", hex: "#191919" },
          { label: "Lunar Blue", hex: "#4C4A46" },
        ],
      },
      X30: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Lunar Blue", hex: "#4C4A46" },
          { label: "Charcoal Black", hex: "#191919" },
        ],
      },
      "X30 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Lunar Blue", hex: "#4C4A46" },
          { label: "Charcoal Black", hex: "#191919" },
        ],
      },
      X50: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X50 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X50 Pro+": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      X60: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Cloud Blue", hex: "#4C4A46" },
          { label: "Night Black", hex: "#191919" },
        ],
      },
      "X60 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cloud Blue", hex: "#4C4A46" },
          { label: "Night Black", hex: "#191919" },
        ],
      },
      "X60 Pro+": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cloud Blue", hex: "#4C4A46" },
          { label: "Night Black", hex: "#191919" },
        ],
      },
      X70: {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X70 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X70 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      X80: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X80 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X80 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      X90: {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X90 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "X90 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      X100: {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "X100 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Sky Blue", hex: "#6EC1E4" },
        ],
      },
      "X100 Ultra": {
        storage: ["512GB", "1TB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Deep Blue", hex: "#1E3D5A" },
        ],
      },
      X110: {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Ocean Blue", hex: "#437691" },
        ],
      },
      "X110 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Ocean Blue", hex: "#437691" },
        ],
      },
      "iQOO Z3 5G": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Alluring Blue", hex: "#4C4A46" },
        ],
      },
      "iQOO 7": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Legendary Black", hex: "#191919" },
          { label: "Legendary Blue", hex: "#4C4A46" },
        ],
      },
      "iQOO 8": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Legendary Black", hex: "#191919" },
          { label: "Legendary Blue", hex: "#4C4A46" },
        ],
      },
      "iQOO 9": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Legendary Black", hex: "#191919" },
          { label: "Legendary Blue", hex: "#4C4A46" },
        ],
      },
      "iQOO 10": {
        storage: ["256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Blue", hex: "#4C4A46" },
          { label: "Eternal Black", hex: "#191919" },
        ],
      },
      "iQOO 11": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Eternal Blue", hex: "#4C4A46" },
          { label: "Eternal Black", hex: "#191919" },
        ],
      },
      "iQOO 12": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Eternal Blue", hex: "#4C4A46" },
        ],
      },
    },
  },
  OnePlus: {
    models: {
      "3": {
        storage: ["64GB"],
        ram: ["6GB"],
        colors: [
          { label: "Soft Gold", hex: "#F5E7D0" },
          { label: "Graphite", hex: "#41424C" },
        ],
      },
      "3T": {
        storage: ["64GB", "128GB"],
        ram: ["6GB"],
        colors: [
          { label: "Soft Gold", hex: "#F5E7D0" },
          { label: "Gunmetal", hex: "#191919" },
        ],
      },
      "5": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Black", hex: "#191919" },
          { label: "Slate Gray", hex: "#41424C" },
        ],
      },
      "5T": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Midnight Black", hex: "#191919" },
          { label: "Midnight Black", hex: "#191919" },
        ],
      },
      "6": {
        storage: ["64GB", "128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mirror Black", hex: "#191919" },
          { label: "Midnight Black", hex: "#191919" },
          { label: "Silk White", hex: "#F2F3F5" },
        ],
      },
      "6T": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mirror Black", hex: "#191919" },
          { label: "Midnight Black", hex: "#191919" },
          { label: "Midnight Black", hex: "#191919" },
        ],
      },
      "7": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mirror Gray", hex: "#41424C" },
          { label: "Glacial Blue", hex: "#4C4A46" },
        ],
      },
      "7 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB", "12GB"],
        colors: [
          { label: "Nebula Blue", hex: "#437691" },
          { label: "Almond", hex: "#F5E7D0" },
        ],
      },
      "7T": {
        storage: ["128GB"],
        ram: ["8GB"],
        colors: [
          { label: "Frosted Silver", hex: "#F1F2ED" },
          { label: "Glacial Blue", hex: "#4C4A46" },
        ],
      },
      "7T Pro": {
        storage: ["256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Haze Blue", hex: "#4C4A46" },
          { label: "Emerald Green", hex: "#505E4C" },
        ],
      },
      "8": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Glacial Green", hex: "#505E4C" },
          { label: "Onyx Black", hex: "#191919" },
        ],
      },
      "8 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Onyx Black", hex: "#191919" },
          { label: "Ultramarine Blue", hex: "#4C4A46" },
        ],
      },
      "8T": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Aquamarine Green", hex: "#505E4C" },
          { label: "Lunar Silver", hex: "#F1F2ED" },
        ],
      },
      "9": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Morningmist Blue", hex: "#4C4A46" },
          { label: "Wintermist Silver", hex: "#F1F2ED" },
          { label: "Babypink", hex: "#FAE0D8" },
        ],
      },
      "9 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Morningmist Blue", hex: "#4C4A46" },
          { label: "Pine Green", hex: "#505E4C" },
        ],
      },
      "9R": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Lake Blue", hex: "#4C4A46" },
          { label: "Rocky Black", hex: "#191919" },
        ],
      },
      "10": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Iron Gray", hex: "#41424C" },
          { label: "Emerald Forest", hex: "#505E4C" },
        ],
      },
      "10 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Emerald Forest", hex: "#505E4C" },
          { label: "Volcanic Black", hex: "#191919" },
        ],
      },
      "10T": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Moonstone Black", hex: "#191919" },
          { label: "Jade Green", hex: "#505E4C" },
        ],
      },
      "11": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Metallic Black", hex: "#191919" },
          { label: "Emerald Forest", hex: "#505E4C" },
        ],
      },
      "12": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Obsidian Black", hex: "#191919" },
          { label: "Alpine Green", hex: "#505E4C" },
        ],
      },
      "12R": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Galactic Black", hex: "#191919" },
          { label: "Jade Green", hex: "#505E4C" },
        ],
      },
      "13": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Alpine Green", hex: "#505E4C" },
        ],
      },
      "14": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Glacier Blue", hex: "#4C4A46" },
        ],
      },
      "14 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Glacier Blue", hex: "#4C4A46" },
        ],
      },
      "Nord (2020)": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Gray Onyx", hex: "#41424C" },
          { label: "Blue Midgray", hex: "#4C4A46" },
        ],
      },
      "Nord 2 5G": {
        storage: ["128GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Gray Onyx", hex: "#41424C" },
          { label: "Blue Haze", hex: "#4C4A46" },
        ],
      },
      "Nord CE": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Charcoal Ink", hex: "#191919" },
          { label: "Blue Void", hex: "#437691" },
        ],
      },
      "Nord CE 2": {
        storage: ["128GB"],
        ram: ["6GB", "8GB", "12GB"],
        colors: [
          { label: "Gray Shade", hex: "#41424C" },
          { label: "Blue Haze", hex: "#4C4A46" },
        ],
      },
      "Nord CE 2 Lite 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Gray Shade", hex: "#41424C" },
          { label: "Blue Haze", hex: "#4C4A46" },
        ],
      },
      "Nord 2T": {
        storage: ["128GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Silver Shadow", hex: "#F1F2ED" },
          { label: "Jade Green", hex: "#505E4C" },
        ],
      },
      "Nord 3 5G": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Tempest Green", hex: "#505E4C" },
          { label: "Glacier Green", hex: "#505E4C" },
          { label: "Black Cool", hex: "#191919" },
        ],
      },
      "Nord 4": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Arctic Blue", hex: "#4C4A46" },
          { label: "Jet Black", hex: "#191919" },
        ],
      },
      "Nord 5": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Ocean Blue", hex: "#437691" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      "Nord 6": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Meteor Blue", hex: "#4C4A46" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Nord 6 Pro": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Nord CE 5 Lite": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Stellar Blue", hex: "#4C4A46" },
          { label: "Cosmic Black", hex: "#191919" },
        ],
      },
      "Nord N30 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      Ace: {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Translucent Blue", hex: "#4C4A46" },
        ],
      },
      "Ace 2": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Emerald Green", hex: "#505E4C" },
        ],
      },
      "Ace 2V": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Emerald Green", hex: "#505E4C" },
        ],
      },
      "Ace 3": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Emerald Green", hex: "#505E4C" },
        ],
      },
      "Ace 4": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Fold 2": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Fold 3": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Emerald Green", hex: "#505E4C" },
        ],
      },
      "Fold 4": {
        storage: ["512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Cosmic Black", hex: "#191919" },
          { label: "Nebula Blue", hex: "#437691" },
        ],
      },
      "Watch 2": {
        storage: [],
        ram: [],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Stainless Steel", hex: "#F1F2ED" },
        ],
      },
      "Watch 2R": {
        storage: [],
        ram: [],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Beige", hex: "#F5E7D0" },
        ],
      },
      "Buds Pro 2": {
        storage: [],
        ram: [],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "White", hex: "#F2F3F5" },
        ],
      },
      "Buds 3": {
        storage: [],
        ram: [],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "White", hex: "#F2F3F5" },
        ],
      },
      "TV Y1": {
        storage: [],
        ram: [],
        colors: [{ label: "Black", hex: "#191919" }],
      },
      "TV U1": {
        storage: [],
        ram: [],
        colors: [{ label: "Black", hex: "#191919" }],
      },
    },
  },
  Realme: {
    models: {
      "1": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "2": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Black", hex: "#191919" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      "3": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Dynamic Black", hex: "#191919" },
          { label: "Radiant Blue", hex: "#437691" },
        ],
      },
      "3 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Dynamic Black", hex: "#191919" },
          { label: "Color Shift Blue", hex: "#4C4A46" },
        ],
      },
      "5": {
        storage: ["32GB", "64GB", "128GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Ocean Blue", hex: "#437691" },
          { label: "Flame Red", hex: "#F57C5F" },
        ],
      },
      "5 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Sapphire Blue", hex: "#3E4B69" },
          { label: "Diamond Red", hex: "#F57C5F" },
        ],
      },
      "6": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Comet Blue", hex: "#4C4A46" },
          { label: "Comet White", hex: "#F2F3F5" },
        ],
      },
      "6 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Lightning Blue", hex: "#437691" },
          { label: "Lightning White", hex: "#F2F3F5" },
        ],
      },
      "7": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mist Blue", hex: "#4C4A46" },
          { label: "Mist White", hex: "#F2F3F5" },
        ],
      },
      "7 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mirror Silver", hex: "#F1F2ED" },
          { label: "Mirror Blue", hex: "#437691" },
        ],
      },
      "8": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Supernova", hex: "#4C4A46" },
          { label: "Infinite Blue", hex: "#437691" },
        ],
      },
      "8 5G": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Supernova", hex: "#4C4A46" },
          { label: "Infinite Blue", hex: "#437691" },
        ],
      },
      "8 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Stellar Blue", hex: "#4C4A46" },
          { label: "Supernova Orange", hex: "#FDD96B" },
        ],
      },
      "9": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Supernova Blue", hex: "#4C4A46" },
        ],
      },
      "9 4G": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Supernova Blue", hex: "#4C4A46" },
        ],
      },
      "9 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Supernova Blue", hex: "#4C4A46" },
        ],
      },
      "9 Pro+": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Stellar Black", hex: "#191919" },
          { label: "Supernova Blue", hex: "#4C4A46" },
        ],
      },
      "10": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "10 Pro": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "10 Pro+": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "11": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "11 Pro": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "11 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "12": {
        storage: ["128GB", "256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "12 Pro": {
        storage: ["256GB"],
        ram: ["8GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "12 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "13": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "13 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "13 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "14": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "14 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "14 Pro+": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "15": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "15 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "16": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "17": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      "17 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB"],
        colors: [
          { label: "Infinite Black", hex: "#191919" },
          { label: "Sunset Gold", hex: "#F5E7D0" },
        ],
      },
      C11: {
        storage: ["32GB"],
        ram: ["2GB", "3GB"],
        colors: [
          { label: "Cool Gray", hex: "#41424C" },
          { label: "Cool Blue", hex: "#437691" },
        ],
      },
      C12: {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Mist Gray", hex: "#41424C" },
          { label: "Mist Blue", hex: "#437691" },
        ],
      },
      C21: {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Mist Blue", hex: "#437691" },
          { label: "Mist Gray", hex: "#41424C" },
        ],
      },
      C31: {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB", "6GB"],
        colors: [
          { label: "Gray", hex: "#41424C" },
          { label: "Blue", hex: "#437691" },
        ],
      },
      C41: {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Lime Blue", hex: "#437691" },
          { label: "Space Blue", hex: "#1E3D5A" },
        ],
      },
      C55: {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Rainy Emerald", hex: "#505E4C" },
          { label: "Glamour Gold", hex: "#F5E7D0" },
        ],
      },
      C57: {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Rainy Emerald", hex: "#505E4C" },
          { label: "Glamour Gold", hex: "#F5E7D0" },
        ],
      },
      C58: {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Rainy Emerald", hex: "#505E4C" },
          { label: "Glamour Gold", hex: "#F5E7D0" },
        ],
      },
      C61: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      C63: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      C65: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      C70: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      C71: {
        storage: ["128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      C81: {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Ocean Blue", hex: "#437691" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      C83: {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Ocean Blue", hex: "#437691" },
          { label: "Star Black", hex: "#191919" },
        ],
      },
      "Narzo 20": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Polar White", hex: "#F2F3F5" },
          { label: "Space Blue", hex: "#437691" },
        ],
      },
      "Narzo 30": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB"],
        colors: [
          { label: "Racing Silver", hex: "#F1F2ED" },
          { label: "Racing Blue", hex: "#437691" },
        ],
      },
      "Narzo 30 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Racing Silver", hex: "#F1F2ED" },
          { label: "Racing Blue", hex: "#437691" },
        ],
      },
      "Narzo 50": {
        storage: ["64GB", "128GB"],
        ram: ["4GB", "6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      "Narzo 50A": {
        storage: ["32GB", "64GB"],
        ram: ["3GB", "4GB"],
        colors: [
          { label: "Glacier Blue", hex: "#4C4A46" },
          { label: "Dynamic Black", hex: "#191919" },
        ],
      },
      "Narzo 50 Pro": {
        storage: ["64GB", "128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      "Narzo 60": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Mint", hex: "#7F9B88" },
          { label: "Black", hex: "#191919" },
        ],
      },
      "Narzo 70": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Space Blue", hex: "#437691" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "Narzo 70x": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Space Blue", hex: "#437691" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "Narzo 80": {
        storage: ["128GB"],
        ram: ["6GB", "8GB"],
        colors: [
          { label: "Space Blue", hex: "#437691" },
          { label: "Starry Black", hex: "#191919" },
        ],
      },
      "GT Neo 2": {
        storage: ["128GB", "256GB"],
        ram: ["6GB", "8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Atlantis Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 3": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 3T": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 5": {
        storage: ["128GB", "256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 5 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 6": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT Neo 7": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT 3": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT 3T": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT 3 Neo": {
        storage: ["128GB", "256GB"],
        ram: ["8GB", "12GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT 5": {
        storage: ["256GB", "512GB"],
        ram: ["8GB", "12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Dawn Blue", hex: "#4C4A46" },
        ],
      },
      "GT 5 Pro": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Titanium Silver", hex: "#F1F2ED" },
        ],
      },
      "GT 6": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Titanium Silver", hex: "#F1F2ED" },
        ],
      },
      "GT 7": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Titanium Silver", hex: "#F1F2ED" },
        ],
      },
      "GT 8": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Titanium Silver", hex: "#F1F2ED" },
        ],
      },
      "GT 10": {
        storage: ["256GB", "512GB"],
        ram: ["12GB", "16GB"],
        colors: [
          { label: "Eternal Black", hex: "#191919" },
          { label: "Titanium Silver", hex: "#F1F2ED" },
        ],
      },
    },
  },
};
