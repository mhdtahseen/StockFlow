# Conventions

## 1. Coding Style
- **TypeScript First**: Strict typing is preferred. Use `interface` for data shapes and `type` for unions/intersections.
- **Functional Components**: Use `export default function Name() {}` or standard arrow functions.
- **Hook-Driven Logic**: Logic is extracted into custom hooks (e.g., `useOrderDetails`, `useSync`) to keep components clean.

## 2. Styling (Tailwind v4)
- **OKLCH Colors**: Perceptive-lighting color variables (`oklch`) are used in `index.css` to allow fluid light/dark mode transitions.
- **Glassmorphism**: Frequent use of `backdrop-blur-xl` and `bg-white/80` (or `dark:bg-slate-950/80`) for headers and overlays.
- **Utility Selection**: Use semantic tokens like `--background`, `--foreground`, and `--primary-500` instead of hardcoded hex values.

## 3. Naming Conventions
- **Files**: PascalCase for components (`Orders.tsx`), camelCase for logic/hooks (`useAppSelector.ts`).
- **Slices**: Use `featureNameSlice` pattern.
- **Selectors**: Prefix with `select` (e.g., `selectInventory`).

## 4. State Management
- **Persistence**: Persist essential domain data (Orders, Inventory) but avoid persisting UI transient state (search terms, open modals).
- **Mutations**: Perform optimistic updates in Redux where possible, with rollback logic on failure.
