/**
 * BottomSheet — Vaul-based native-feel bottom drawer.
 *
 * Drop-in replacement for <Sheet side="bottom"> with swipe-to-dismiss,
 * momentum physics, and snap points. Exports the same component names as
 * sheet.tsx so the only change needed per-file is the import path.
 */
import * as React from "react";
import { Drawer } from "vaul";
import { cn } from "@/lib/utils";

// ── Root ─────────────────────────────────────────────────────────────────────
function Sheet({
  shouldScaleBackground = false,
  ...props
}: React.ComponentProps<typeof Drawer.Root> & { shouldScaleBackground?: boolean }) {
  return (
    <Drawer.Root
      shouldScaleBackground={shouldScaleBackground}
      {...props}
    />
  );
}

// ── Trigger ───────────────────────────────────────────────────────────────────
function SheetTrigger({ ...props }: React.ComponentProps<typeof Drawer.Trigger>) {
  return <Drawer.Trigger {...props} />;
}

// ── Close ─────────────────────────────────────────────────────────────────────
function SheetClose({ ...props }: React.ComponentProps<typeof Drawer.Close>) {
  return <Drawer.Close {...props} />;
}

// ── Portal ────────────────────────────────────────────────────────────────────
function SheetPortal({ ...props }: React.ComponentProps<typeof Drawer.Portal>) {
  return <Drawer.Portal {...props} />;
}

// ── Overlay ───────────────────────────────────────────────────────────────────
function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Overlay>) {
  return (
    <Drawer.Overlay
      className={cn("fixed inset-0 z-[70] bg-black/50", className)}
      {...props}
    />
  );
}

// ── Content ───────────────────────────────────────────────────────────────────
// Accepts side prop for API compatibility — it's always "bottom" for this component.
function SheetContent({
  className,
  children,
  side: _side, // accepted but ignored — always bottom
  showCloseButton: _showClose, // accepted but ignored — drag handle replaces close btn
  ...props
}: React.ComponentProps<typeof Drawer.Content> & {
  side?: "top" | "right" | "bottom" | "left";
  showCloseButton?: boolean;
}) {
  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        aria-describedby={undefined}
        className={cn(
          // Base: fixed bottom sheet with rounded top corners
          "fixed bottom-0 left-0 right-0 z-[70] flex flex-col",
          "bg-background border-t border-slate-200 dark:border-slate-800",
          "shadow-2xl",
          // Safe-area: extra padding at bottom for iPhone home indicator
          "pb-[env(safe-area-inset-bottom,0px)]",
          // Max height guard
          "max-h-[95vh]",
          className,
        )}
        {...props}
      >
        {/* Drag handle */}
        <div className="mx-auto mt-3 mb-1 h-1.5 w-12 shrink-0 rounded-full bg-slate-300 dark:bg-slate-600" />
        {children}
      </Drawer.Content>
    </SheetPortal>
  );
}

// ── Header ────────────────────────────────────────────────────────────────────
function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-4", className)}
      {...props}
    />
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────
function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  );
}

// ── Title ─────────────────────────────────────────────────────────────────────
function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Title>) {
  return (
    <Drawer.Title
      className={cn("font-semibold text-foreground", className)}
      {...props}
    />
  );
}

// ── Description ───────────────────────────────────────────────────────────────
function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof Drawer.Description>) {
  return (
    <Drawer.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
};
