# 🛠 stockflow Development Guide

This document defines the coding standards, patterns, and state management rules for the stockflow codebase.

---

## 🏗 Coding Standards

- **Language**: TypeScript (Strict mode enabled).
- **Styling**: Tailwind CSS 4. Prefer CSS variables for tokens.
- **Components**: Functional components only. Use `lucide-react` for icons.

---

## ⚡ State Management Patterns (Redux Toolkit)

### 1. The "Listen-Only" Financial Layer
We avoid manually calling `addLedgerEntry` from UI components whenever possible. Instead, we use the **Watchtower Pattern** in `ledger/slice.ts`.

**How to add an automated ledger entry:**
1.  Identify the business action (e.g., `updatePhone`).
2.  Open `src/features/ledger/slice.ts`.
3.  Add the action to `extraReducers` using `builder.addCase`.

```typescript
// Example from ledger/slice.ts
builder.addCase(updatePhone, (state, action) => {
  const { id, phone, prevPrice } = action.payload;
  if (prevPrice !== phone.purchasePrice) {
    state.pendingEntries.push({
      type: "INVENTORY_ADJUSTMENT",
      amount: phone.purchasePrice - prevPrice,
      note: `Price update for #${id}`,
      // ...
    });
  }
});
```

### 2. Async Lifecycle
- Use `createAsyncThunk` for network operations.
- Always check `isMounted.current` before updating state in an async callback to prevent memory leaks and crashes.

---

## 📸 Scanner UI Pattern (Passive HUD)

When building high-performance camera overlays, follow our **Passive HUD Pattern**:

1.  **Refs over State**: Store frequently changing values (like OCR detection status) in a `useRef`.
2.  **Direct DOM Binding**: Create a `div` for the UI indicator (e.g., "OCR Active") and attach a `ref`.
3.  **Update Loop**: Inside the camera processing loop, toggle the UI elements directly:
    ```typescript
    if (isScanning && ocrBadgeRef.current) {
        ocrBadgeRef.current.style.opacity = "1";
    }
    ```
- **Why?** React state updates force the `<video>` element to refresh its buffer, causing a visible flicker. Direct DOM updates bypass this entirely.

---

## 🎨 Design Tokens

Avoid "simple" colors. Use our premium palette tokens in `index.css`:

- **Primary**: Sleek slates and charcoals.
- **Glassmorphism**: Use `backdrop-blur` and `bg-slate-900/40` sparingly.
- **Animations**: Prefer `framer-motion` for page transitions and `tw-animate-css` for micro-interactions (like button clicks).

---

## 📦 Pull Request Checklist
1. [ ] Correctly typed all new props and state.
2. [ ] If adding financial logic, ensured a corresponding Ledger entry is created.
3. [ ] Tested scanner performance on both Desktop and Mobile (if changed).
4. [ ] Verified PWA manifest icons are correct.
