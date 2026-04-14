# ⚙️ stockflow Configuration Guide

This document covers all the settings required to deploy, run, and tune the stockflow platform.

---

## 🔑 Environment Variables

The project uses Vite-style environment variables. Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key

# App Environment
VITE_APP_ENV=development # development | production
```

> [!IMPORTANT]
> **Production Context**: In a production build, these variables will be injected by the CI/CD pipeline (e.g., Vercel Environment Variables).

---

## 📸 Scanner & OCR Configuration

The OCR engine (`src/utils/ocrService.ts`) is tuned for high-speed hardware scanning.

### Tesseract Selection Modes
We use specific Page Segmentation Modes (PSM) for accuracy:
- **Default**: `PSM.SINGLE_LINE` (7) — Best for capturing a single IMEI string.
- **Fallback**: `PSM.SINGLE_BLOCK` (6) — Used if multiple lines of text are detected.

### Log Suppression
Internal WASM/Tesseract logs are suppressed by default to keep the developer console clean:
```typescript
// Inside src/utils/ocrService.ts
const worker = await createWorker({
  logger: () => {}, // Silences LSTM core logs
});
```

---

## 📦 PWA & Vite Configuration

The project is configured as a Progressive Web App (PWA) via `vite-plugin-pwa`.

### Service Worker
- **Mode**: `generateSW` — Automatically generates a service worker that caches the UI assets.
- **Caching Strategy**: `staleWhileRevalidate` for assets and fonts to ensure the app works instantly offline.

### Manifest Settings (`vite.config.ts`)
The PWA manifest defines:
- **Display**: `standalone` (removes browser UI on mobile).
- **Background Color**: Stated as CSS tokens to match the premium dark mode.

---

## 🚀 Deployment (Vercel)

The root `vercel.json` ensures that client-side routing works correctly:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

To deploy:
1.  Connect your repo to Vercel.
2.  Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the Vercel dashboard.
3.  Deploy. The platform will automatically optimize for the production environment.
