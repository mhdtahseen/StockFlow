import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Portals children into ALL .header-actions-target slots.
 * There are two slots: one in AppHeader (mobile) and one in DesktopTopBar (desktop).
 * CSS (md:hidden / hidden md:flex) ensures only the relevant slot is visible.
 */
export default function HeaderActions({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const targets = Array.from(
    document.querySelectorAll<HTMLElement>('.header-actions-target')
  );
  if (!targets.length) return null;

  return (
    <>
      {targets.map((target, i) =>
        createPortal(
          <React.Fragment key={i}>{children}</React.Fragment>,
          target,
          `ha-portal-${i}`
        )
      )}
    </>
  );
}
