import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * A utility component that renders its children into the AppHeader's action slot.
 * Uses a React Portal to "teleport" UI from a page into the global header.
 */
export default function HeaderActions({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const target = document.getElementById('header-actions-target');
  if (!target) return null;

  return createPortal(children, target);
}
