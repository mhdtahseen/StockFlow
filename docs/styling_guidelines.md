# StockFlow — Styling & Design Guidelines

## 1. Design Architecture

The StockFlow application follows a modern, **utility-first CSS** approach heavily reliant on **Tailwind CSS v4** combined with highly reusable component patterns. The architecture enforces consistency through a standardized design system built directly into the CSS variables.

### Core Principles:

- **Offline-First Resilience**: UI must feel snappy and responsive immediately, utilizing local caching and optimistic updates without heavy loading spinners.
- **Glassmorphism & Depth**: Usage of `backdrop-blur` and nuanced shadows (e.g. `shadow-sm`, `shadow-2xl`) to create hierarchy and separation between the background and foreground interactive elements.
- **Dark Mode as a First-Class Citizen**: The entire application uses `oklch` standard color variables that fluidly invert and adapt based on the user's OS preference (`.dark` class).
- **Responsive & Mobile-Centric**: Since this is heavily used by physical merchants, touch sizing, thumb readability, and bottom-heavy navigation spacing constraints apply.

## 2. UI Libraries Used

To achieve rapid development while maintaining an enterprise look and feel, we harness the following tools:

- **Tailwind CSS (v4.x)**: The primary styling engine for utility classes. (Note: Tailwind v4 removes the need for a root `tailwind.config.js` file, consolidating configuration via CSS imports and the `@theme` directive).
- **Shadcn UI (`shadcn`)**: An unstyled, highly accessible component library built on top of Radix UI primitives. It uses the `new-york` visual style.
- **Radix UI Primitives (`radix-ui`)**: Provides the unstyled foundational logic for complex interactive components (Dialogs, Popovers, Tabs).
- **Lucide React (`lucide-react`)**: The exclusive icon pack used throughout the application. Picked for its clean, cohesive, and professional rounded stroke design.
- **TW-Animate-CSS (`tw-animate-css`)**: Used for micro-animations and smooth transition effects alongside standard Tailwind classes.
- **Sonner (`sonner`)**: For highly aesthetic, toast-based alert notifications.
- **Tailwind Merge (`tailwind-merge`) & CLSX (`clsx`)**: Critical utility libraries for dynamically resolving and overriding Tailwind class conflicts within React components securely.

## 3. Color Palette

The global color palette heavily focuses on exact perceptive lighting scales using `oklch` format colors in the CSS.

### Primary Brand

- **Brand Blue (`#064a98`)**: Used for call-to-actions, primary buttons, and critical focus states. (Custom declared in CSS as `--color-primary-500`).

### System Scales (Light & Dark)

Instead of hardcoding hex codes across components, we map functional semantic names to CSS variables that flip depending on the active `.dark` class.

**Key Functional Mappings:**

- `--background`: The absolute background canvas (White in light mode, Dark Slate/Onyx in dark mode).
- `--foreground`: Primary text color representing extreme contrast to the background.
- `--card` / `--card-foreground`: For elevated surfaces like data tables and metric widgets.
- `--muted` / `--muted-foreground`: For secondary text and subdued, washed-out structural borders.
- `--destructive`: Strict Red tones reserved solely for irreversible actions (Deletions).

_(Example usage in React: `className="bg-background text-foreground"` or `className="bg-slate-50 dark:bg-slate-950"`)._

## 4. Spacings & Typography

- **Spacing System**: Follows standard 4px increments strictly inherited from Tailwind core. (e.g. `p-4` = 16px, `p-6` = 24px, `mb-2` = 8px).
- **Border Radius**: Driven by dynamic root variables to ensure absolute consistency.
  - Standard Radius: `--radius: 0.625rem` (10px).
  - Derived radii cascade from this: `--radius-lg`, `--radius-md`, `--radius-sm`.
- **Typography Base**: Clean, legible, system sans-serif fonts: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`.
- **Typographic Scaling**:
  - `text-[10px]` & `text-xs`: Labeling, metadata, and table sub-text. Frequent use of `uppercase tracking-wider font-bold` for table headers and semantic data groupings.
  - `text-sm`: Standard reading text.
  - `text-base` / `text-lg`: Emphasized interactive elements.
  - `text-2xl` / `text-3xl`: Hero statistics and dashboard grand metrics.

## 5. Global Styles Definition

Global styles and Tailwind configurations are strictly consolidated into one master file:
**Location:** `/src/index.css`

Here is a breakdown of how it's structured:

```css
/* 1. Core Module Imports */
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

/* 2. Theme Customizations (Tailwind v4 syntax replacing tailwind.config.ts) */
@theme {
  --color-primary-500: #064a98; /* Injects custom brand color globally */
}

/* 3. Base HTML Resets */
body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", ...;
  -webkit-font-smoothing: antialiased;
}

/* 4. Radius and Semantic Variable Mappings */
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  /* ... maps dynamic tokens to utility syntax */
}

/* 5. Light Mode Root Tones (OKLCH Format) */
:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  /* ... */
}

/* 6. Dark Mode Tone Inversions */
.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  /* ... */
}

/* 7. Base Component Forcing */
@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

## 6. Everything In-Between

- **Component Overrides**: For Shadcn components (found loosely in `src/components/ui/*.tsx`), their default styles are pre-mapped to the variables declared in `index.css`. Modifications to complex primitives happen directly inside those specific `ui` wrapper components.
- **Conditional Rendering**: Use `clsx` inside the application to join standard tailwind with conditional state. Avoid string interpolation whenever possible.
- **Context Overrides**: Standard styling fallback layers are dictated from the `.dark` class dynamically appended to the HTML body using `src/context/ThemeContext.tsx`.
