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
import App from "./App";
import "./index.css";

// Register the PWA service worker with aggressive update checks
registerSW({
  immediate: true,
  onRegistered(r) {
    if (r) {
      // Check for updates every time the app comes back to the foreground (highly effective for iOS home screen PWAs)
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          r.update();
        }
      });
      // Also poll for updates periodically (e.g., every 1 hour) over long sessions
      setInterval(
        () => {
          r.update();
        },
        60 * 60 * 1000,
      );
    }
  },
});

// Listen for the service worker taking control. The 'autoUpdate' strategy
// will automatically install and claim clients, but we need to reload the
// page so the browser fetches the new HTML/JS instead of running old cached code.
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
      // CRITICAL: DONT RELOAD IF SYNC IS PENDING
      // If we reload during a sync, we might lose local state if persistence hasn't finished.
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
