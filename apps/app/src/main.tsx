import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor as reduxPersistor } from "./app/store";
import { ThemeProvider } from "./context/ThemeContext";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { registerSW } from "virtual:pwa-register";
import { AuthProvider } from "./context/AuthContext";
import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { supabase } from "./lib/supabase";
import { initPostHog } from "./lib/posthog";
import App from "./App";
import "./index.css";

initPostHog();

// Handle deep links from auth emails on native (e.g. password reset, magic link).
// When the user taps com.hyllos.finventree://callback?code=… in their email,
// the OS opens the app here. We pass the URL to Supabase to exchange the code.
// Also handles Trade Network connect links: com.hyllos.finventree://connect/ABC123
if (Capacitor.isNativePlatform()) {
  CapApp.addListener('appUrlOpen', async ({ url }) => {
    if (url.startsWith('com.hyllos.finventree://')) {
      const urlObj = new URL(url.replace('com.hyllos.finventree://', 'https://placeholder/'));

      // Trade Network: com.hyllos.finventree://connect/ABC123
      const connectMatch = url.match(/com\.hyllos\.finventree:\/\/connect\/([A-Z2-9]{6})/i);
      if (connectMatch) {
        const tradeCode = connectMatch[1].toUpperCase();
        // Navigate to /customers?connect=CODE — ConnectSheet will open automatically
        window.location.hash = `#/customers?connect=${tradeCode}`;
        return;
      }

      // Auth deep links: extract PKCE code and exchange for session
      const code = urlObj.searchParams.get('code');
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
    }
  });
}

// On native (Android/iOS via Capacitor), push notifications and updates are handled
// by native plugins. Only activate the PWA service worker on the web platform.
if (!Capacitor.isNativePlatform()) {
  registerSW({
    immediate: true,
    onRegistered(r) {
      if (r) {
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible") {
            r.update();
          }
        });
        setInterval(() => { r.update(); }, 60 * 60 * 1000);
      }
    },
  });

  if ("serviceWorker" in navigator) {
    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!refreshing) {
        const outboxCount = store.getState().sync.outbox.length;
        if (outboxCount > 0) {
          console.warn(`[PWA] Update available, but delaying reload for ${outboxCount} pending sync items.`);
          return;
        }
        refreshing = true;
        window.location.reload();
      }
    });
  }
}

// Setup React Query Client with Offline Persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24 * 7, // 7 days cache
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={reduxPersistor}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister }}
        >
          <ThemeProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </ThemeProvider>
        </PersistQueryClientProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>,
);
