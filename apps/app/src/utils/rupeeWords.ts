/**
 * rupeeWords — converts a numeric rupee amount into natural language.
 *
 * Uses Indian numbering: Lakh / Crore system.
 * Returns bilingual string: "पंद्रह हज़ार  Fifteen Thousand"
 *
 * Supports up to 99,99,99,999 (≈ 99 crore).
 */

const ONES_HI = [
  "", "एक", "दो", "तीन", "चार", "पाँच", "छह", "सात", "आठ", "नौ",
  "दस", "ग्यारह", "बारह", "तेरह", "चौदह", "पंद्रह", "सोलह", "सत्रह", "अठारह", "उन्नीस",
  "बीस", "इक्कीस", "बाईस", "तेईस", "चौबीस", "पच्चीस", "छब्बीस", "सत्ताईस", "अट्ठाईस", "उनतीस",
  "तीस", "इकतीस", "बत्तीस", "तैंतीस", "चौंतीस", "पैंतीस", "छत्तीस", "सैंतीस", "अड़तीस", "उनचालीस",
  "चालीस", "इकतालीस", "बयालीस", "तैंतालीस", "चौंतालीस", "पैंतालीस", "छियालीस", "सैंतालीस", "अड़तालीस", "उनचास",
  "पचास", "इक्यावन", "बावन", "तिरपन", "चौवन", "पचपन", "छप्पन", "सत्तावन", "अट्ठावन", "उनसठ",
  "साठ", "इकसठ", "बासठ", "तिरसठ", "चौंसठ", "पैंसठ", "छियासठ", "सड़सठ", "अड़सठ", "उनहत्तर",
  "सत्तर", "इकहत्तर", "बहत्तर", "तिहत्तर", "चौहत्तर", "पचहत्तर", "छिहत्तर", "सतहत्तर", "अठहत्तर", "उनासी",
  "अस्सी", "इक्यासी", "बयासी", "तिरासी", "चौरासी", "पचासी", "छियासी", "सत्तासी", "अट्ठासी", "नवासी",
  "नब्बे", "इक्यानवे", "बानवे", "तिरानवे", "चौरानवे", "पचानवे", "छियानवे", "सत्तानवे", "अट्ठानवे", "निन्यानवे",
];

const ONES_EN = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  "Twenty", "Twenty-One", "Twenty-Two", "Twenty-Three", "Twenty-Four", "Twenty-Five",
  "Twenty-Six", "Twenty-Seven", "Twenty-Eight", "Twenty-Nine",
  "Thirty", "Thirty-One", "Thirty-Two", "Thirty-Three", "Thirty-Four", "Thirty-Five",
  "Thirty-Six", "Thirty-Seven", "Thirty-Eight", "Thirty-Nine",
  "Forty", "Forty-One", "Forty-Two", "Forty-Three", "Forty-Four", "Forty-Five",
  "Forty-Six", "Forty-Seven", "Forty-Eight", "Forty-Nine",
  "Fifty", "Fifty-One", "Fifty-Two", "Fifty-Three", "Fifty-Four", "Fifty-Five",
  "Fifty-Six", "Fifty-Seven", "Fifty-Eight", "Fifty-Nine",
  "Sixty", "Sixty-One", "Sixty-Two", "Sixty-Three", "Sixty-Four", "Sixty-Five",
  "Sixty-Six", "Sixty-Seven", "Sixty-Eight", "Sixty-Nine",
  "Seventy", "Seventy-One", "Seventy-Two", "Seventy-Three", "Seventy-Four", "Seventy-Five",
  "Seventy-Six", "Seventy-Seven", "Seventy-Eight", "Seventy-Nine",
  "Eighty", "Eighty-One", "Eighty-Two", "Eighty-Three", "Eighty-Four", "Eighty-Five",
  "Eighty-Six", "Eighty-Seven", "Eighty-Eight", "Eighty-Nine",
  "Ninety", "Ninety-One", "Ninety-Two", "Ninety-Three", "Ninety-Four", "Ninety-Five",
  "Ninety-Six", "Ninety-Seven", "Ninety-Eight", "Ninety-Nine",
];

function hundredsHi(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let result = "";
  if (h > 0) result += ONES_HI[h] + " सौ";
  if (rem > 0) result += (result ? " " : "") + ONES_HI[rem];
  return result;
}

function hundredsEn(n: number): string {
  if (n === 0) return "";
  const h = Math.floor(n / 100);
  const rem = n % 100;
  let result = "";
  if (h > 0) result += ONES_EN[h] + " Hundred";
  if (rem > 0) result += (result ? " " : "") + ONES_EN[rem];
  return result;
}

/**
 * Returns a bilingual Hindi + English representation of an Indian rupee amount.
 * e.g. rupeeWords(15000) → "पंद्रह हज़ार  Fifteen Thousand"
 * e.g. rupeeWords(125500) → "एक लाख पच्चीस हज़ार पाँच सौ  One Lakh Twenty-Five Thousand Five Hundred"
 */
export function rupeeWords(amount: number): string {
  if (!isFinite(amount) || amount <= 0) return "";
  const n = Math.round(amount); // work with integers only

  const crore = Math.floor(n / 1_00_00_000);
  const lakh = Math.floor((n % 1_00_00_000) / 1_00_000);
  const thousand = Math.floor((n % 1_00_000) / 1_000);
  const remainder = n % 1_000;

  // ── Hindi ──────────────────────────────────────────────────────────────────
  const hiParts: string[] = [];
  if (crore > 0) hiParts.push(hundredsHi(crore) + " करोड़");
  if (lakh > 0) hiParts.push(hundredsHi(lakh) + " लाख");
  if (thousand > 0) hiParts.push(hundredsHi(thousand) + " हज़ार");
  if (remainder > 0) hiParts.push(hundredsHi(remainder));
  const hindi = hiParts.join(" ") + " रुपये";

  // ── English ────────────────────────────────────────────────────────────────
  const enParts: string[] = [];
  if (crore > 0) enParts.push(hundredsEn(crore) + " Crore");
  if (lakh > 0) enParts.push(hundredsEn(lakh) + " Lakh");
  if (thousand > 0) enParts.push(hundredsEn(thousand) + " Thousand");
  if (remainder > 0) enParts.push(hundredsEn(remainder));
  const english = enParts.join(" ");

  return `${hindi}  ${english}`;
}

/**
 * Short display: just the Hindi denomination label for large amounts.
 * e.g. shortRupeeLabel(150000) → "₹1.5 लाख"
 * e.g. shortRupeeLabel(25000000) → "₹2.5 करोड़"
 */
export function shortRupeeLabel(amount: number): string {
  if (!isFinite(amount) || amount <= 0) return "";
  if (amount >= 1_00_00_000) return `₹${(amount / 1_00_00_000).toFixed(2).replace(/\.?0+$/, "")} करोड़`;
  if (amount >= 1_00_000) return `₹${(amount / 1_00_000).toFixed(2).replace(/\.?0+$/, "")} लाख`;
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1).replace(/\.?0+$/, "")} हज़ार`;
  return `₹${amount}`;
}
