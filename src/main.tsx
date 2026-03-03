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

// Register the PWA service worker
registerSW({ immediate: true });

// Listen for the service worker taking control. The 'autoUpdate' strategy
// will automatically install and claim clients, but we need to reload the
// page so the browser fetches the new HTML/JS instead of running old cached code.
if ("serviceWorker" in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!refreshing) {
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
