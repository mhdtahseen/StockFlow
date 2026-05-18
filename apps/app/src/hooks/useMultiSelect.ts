import { useState, useCallback, useRef } from "react";

export function useMultiSelect<T extends { id: string }>(items: T[]) {
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectedItems = items.filter((item) => selectedIds.includes(item.id));

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }, []);

  const toggleAll = useCallback(
    (visibleItems: T[]) => {
      const visibleIds = visibleItems.map((i) => i.id);
      const allSelected = visibleIds.every((id) => selectedIds.includes(id));
      setSelectedIds(allSelected ? [] : visibleIds);
    },
    [selectedIds],
  );

  const enterMultiSelect = useCallback((firstId?: string) => {
    setIsMultiSelect(true);
    if (firstId) setSelectedIds([firstId]);
  }, []);

  const exitMultiSelect = useCallback(() => {
    setIsMultiSelect(false);
    setSelectedIds([]);
  }, []);

  /** Attach to onTouchStart / onMouseDown of a card */
  const startLongPress = useCallback(
    (id: string) => {
      if (isMultiSelect) return;
      longPressTimer.current = setTimeout(() => {
        navigator.vibrate?.(30);
        enterMultiSelect(id);
      }, 500);
    },
    [isMultiSelect, enterMultiSelect],
  );

  /** Attach to onTouchEnd / onMouseUp / onMouseLeave */
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return {
    isMultiSelect,
    selectedIds,
    selectedItems,
    toggleSelect,
    toggleAll,
    enterMultiSelect,
    exitMultiSelect,
    startLongPress,
    cancelLongPress,
  };
}
