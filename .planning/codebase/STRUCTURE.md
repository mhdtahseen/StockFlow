# Structure

## 1. Top-Level Layout
- `.agent/`: GSD configuration, skills, and workflows.
- `.planning/`: Project roadmap, requirements, and codebase mapping.
- `docs/`: Historical design docs, schemas, and staging reports.
- `src/`: Main application source code.
- `supabase/`: Local database development, seed data, and config.

## 2. Core Source (`src/`) breakdown
- `src/app/`: Redux store configuration and custom hooks.
- `src/components/`:
  - `ui/`: Raw Shadcn primitives.
  - `shared/`: High-level reusable components (Scanners, Modal sheets, Buttons).
  - `layout/`: Global Shell, Navbar, and Header components.
- `src/features/`: Feature-sliced logic folders. Each typically contains:
  - `api/`: Supabase fetchers/mutators.
  - `components/`: Feature-specific UI.
  - `hooks/`: Domain-specific React hooks.
  - `slices/`: Redux state slice definitions.
  - `types/`: TypeScript interfaces.
- `src/pages/`: Page-level components (Routes).
- `src/utils/`: Generic utility functions (Formatters, PDF generators).

## 3. Configuration Files
- `index.html`: Entry point with PWA meta tags.
- `vite.config.ts`: Compilation and PWA plugin settings.
- `components.json`: Shadcn component manifests.
- `ts_errors.txt`: Current build status/known type errors.
