import { useRef, useState, useCallback, useEffect } from "react";

const THRESHOLD = 72; // px of pull distance before triggering
const MAX_PULL = 108; // hard cap for indicator travel

export function usePullToRefresh(onRefresh: () => void, disabled = false) {
  const containerRef = useRef<HTMLElement>(null);
  const startYRef = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isTriggered, setIsTriggered] = useState(false);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || isTriggered) return;
      const el = containerRef.current;
      if (!el || el.scrollTop > 0) return;
      startYRef.current = e.touches[0].clientY;
    },
    [disabled, isTriggered],
  );

  // Attach touchmove as { passive: false } so e.preventDefault() works —
  // this suppresses the native iOS rubber-band and Android overscroll glow
  // when the user is performing a PTR gesture.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || disabled) return;

    const handleTouchMove = (e: TouchEvent) => {
      if (startYRef.current === null) return;
      if (el.scrollTop > 0) {
        startYRef.current = null;
        setPullDistance(0);
        return;
      }
      const delta = e.touches[0].clientY - startYRef.current;
      // Negative delta = upward swipe (scrolling into content) — bail out
      // so iOS can handle it natively for this touch sequence.
      if (delta <= 0) {
        startYRef.current = null;
        return;
      }
      // Only commit to PTR once the pull is clearly intentional (>8px).
      // On iOS WKWebView, calling preventDefault() on ANY touchmove in a
      // sequence hijacks the entire gesture — even future upward moves in
      // the same touch won't scroll. Waiting for 8px avoids blocking normal
      // scrolls that start with a brief downward wobble.
      if (delta < 8) return;
      e.preventDefault(); // suppress native overscroll while pulling
      setPullDistance(Math.min(Math.sqrt(delta) * 7, MAX_PULL));
    };

    el.addEventListener("touchmove", handleTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", handleTouchMove);
  }, [disabled]);

  const onTouchEnd = useCallback(() => {
    if (startYRef.current === null) return;
    if (pullDistance >= THRESHOLD) {
      setIsTriggered(true);
      onRefresh();
      setTimeout(() => setIsTriggered(false), 1500);
    }
    setPullDistance(0);
    startYRef.current = null;
  }, [pullDistance, onRefresh]);

  return {
    containerRef,
    pullDistance,
    isTriggered,
    threshold: THRESHOLD,
    // onTouchMove is now a native listener — only start/end go on the element
    ptrHandlers: { onTouchStart, onTouchEnd } as const,
  };
}
