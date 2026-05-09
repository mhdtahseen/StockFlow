# Technology Stack

**Analysis Date:** 2026-04-23

## Languages

**Primary:**
- TypeScript 5.9.x - Application code in `src/**/*.ts` and `src/**/*.tsx`

**Secondary:**
- SQL (PostgreSQL dialect) - Database constraints, RLS policies, and RPC functions in `supabase/migrations/*.sql`
- Python 3.11 - Device catalog ingestion in `scraper/scrape.py` and `scraper/push_to_supabase.py`
- JSON - Build/deploy/project configuration in `package.json`, `tsconfig.json`, and `vercel.json`

## Runtime

**Environment:**
- Browser runtime for React SPA, service worker lifecycle, and Push API handling in `src/main.tsx` and `src/hooks/usePushNotifications.ts`
- Node.js runtime for `vite` development/build commands defined in `package.json`

**Package Manager:**
- npm (lockfile-based install flow)
- Lockfile: present (`package-lock.json`)

## Frameworks

**Core:**
- React 19.2.4 - UI framework, app bootstrap in `src/main.tsx`
- Redux Toolkit 2.11.2 + React Redux 9.2.0 - state management in `src/app/store.ts`
- React Router DOM 7.13.1 - route orchestration in `src/App.tsx`
- Supabase JS 2.98.0 - auth, table CRUD, and RPC client in `src/lib/supabase.ts` and `src/app/supabaseApi.ts`

**Testing:**
- Not detected

**Build/Dev:**
- Vite 7.3.1 + `@vitejs/plugin-react` - development server and bundling (`vite.config.ts`, `package.json`)
- TypeScript compiler 5.9.x - static type-check in `build` script (`package.json`)
- Tailwind CSS 4.2.1 + `@tailwindcss/vite` - styling pipeline in `vite.config.ts`
- `vite-plugin-pwa` 1.2.0 + Workbox runtime - PWA manifest/service-worker behavior in `vite.config.ts` and `src/main.tsx`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.98.0 - primary backend integration for auth/data/RPC
- `@reduxjs/toolkit` 2.11.2 - core business-state reducer system
- `redux-persist` 6.0.0 + `localforage` 1.10.0 - offline-first persistence for app state in `src/app/store.ts`
- `@tanstack/react-query` 5.90.21 and persistence plugins - query caching and hydration in `src/main.tsx`
- `react-router-dom` 7.13.1 - authenticated/admin route composition in `src/App.tsx`

**Infrastructure:**
- `tesseract.js` 7.0.0 - OCR worker for IMEI extraction in `src/utils/ocrService.ts`
- `@zxing/browser` / `@zxing/library` - device scanning stack configured via manual chunks in `vite.config.ts`
- `workbox-window` 7.4.0 - service worker update management in `src/main.tsx`

## Configuration

**Environment:**
- Frontend Supabase client requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (`src/lib/supabase.ts`, `docs/CONFIGURATION.md`)
- Deployment environment convention includes `VITE_APP_ENV` in `docs/CONFIGURATION.md`
- Scraper automation requires `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` (`scraper/push_to_supabase.py`, `.github/workflows/catalog-update.yml`)

**Build:**
- Build and runtime config files: `vite.config.ts`, `tsconfig.json`, `package.json`, `vercel.json`
- CI workflow config for data ingestion: `.github/workflows/catalog-update.yml`

## Platform Requirements

**Development:**
- Node.js + npm for app development/build (`package.json`, `package-lock.json`)
- Python 3.11 + pip for scraper pipeline (`scraper/requirements.txt`, `.github/workflows/catalog-update.yml`)
- Supabase project access for local auth/data flows (`src/lib/supabase.ts`, `supabase/migrations/*.sql`)

**Production:**
- Static SPA hosting with rewrite-to-index support (`vercel.json`)
- Supabase backend (PostgreSQL + Auth + PostgREST/RPC) for all core business flows (`src/app/supabaseApi.ts`, `src/context/AuthContext.tsx`)

---

*Stack analysis: 2026-04-23*
