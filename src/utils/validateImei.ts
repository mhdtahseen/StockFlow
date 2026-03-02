/**
 * IMEI Validation Utilities
 *
 * An IMEI (International Mobile Equipment Identity) is a 15-digit number
 * used to identify mobile devices on a cellular network.
 *
 * Validation Rules:
 * 1. Exactly 15 numeric digits
 * 2. Passes the Luhn checksum algorithm
 */

export type ImeiStatus =
  | "UNVERIFIED"
  | "CLEAN"
  | "BLACKLISTED"
  | "LOCKED"
  | "UNKNOWN";

export interface ImeiEntry {
  value: string;
  status: ImeiStatus;
}

/**
 * Sanitizes an IMEI string by removing all non-digit characters.
 */
export function sanitizeImei(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Checks if the IMEI is exactly 15 digits.
 */
export function isValidImeiFormat(imei: string): boolean {
  return /^[0-9]{15}$/.test(imei);
}

/**
 * Validates the IMEI using the Luhn checksum algorithm.
 * This is the industry-standard check for IMEI integrity.
 *
 * The algorithm works by:
 * 1. Starting from the rightmost digit, double the value of every second digit
 * 2. If doubling results in a number > 9, subtract 9
 * 3. Sum all the digits
 * 4. If total modulo 10 equals 0, the IMEI is valid
 */
export function isValidImeiLuhn(imei: string): boolean {
  if (!isValidImeiFormat(imei)) return false;

  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);

    // Double every second digit (0-indexed, so odd indices)
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
  }

  return sum % 10 === 0;
}

/**
 * Full IMEI validation — format + Luhn.
 * Returns a human-readable error or null if valid.
 */
export function validateImei(raw: string): string | null {
  const cleaned = sanitizeImei(raw);

  if (cleaned.length === 0) return "IMEI is required";
  if (cleaned.length !== 15)
    return `Must be 15 digits (currently ${cleaned.length})`;
  if (!isValidImeiLuhn(cleaned)) return "Invalid IMEI (checksum failed)";

  return null; // Valid
}

/** CEIR verification URL (manual redirect) */
export const CEIR_VERIFICATION_URL =
  "https://www.ceir.gov.in/Device/CeirImeiVerification.jsp";
