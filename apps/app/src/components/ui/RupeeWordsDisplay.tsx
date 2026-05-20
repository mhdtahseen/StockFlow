/**
 * RupeeWordsDisplay — shows an amount in Hindi + English words.
 *
 * Usage:
 *   <RupeeWordsDisplay amount={parseFloat(priceStr)} />
 *
 * Only renders when amount > 0. Subtle text, no layout shift.
 */
import { rupeeWords } from "@/utils/rupeeWords";

interface Props {
  amount: number;
  className?: string;
}

export function RupeeWordsDisplay({ amount, className }: Props) {
  if (!amount || amount <= 0 || !isFinite(amount)) return null;
  const words = rupeeWords(amount);
  if (!words) return null;

  return (
    <p
      className={
        className ??
        "mt-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 leading-snug"
      }
    >
      {words}
    </p>
  );
}
