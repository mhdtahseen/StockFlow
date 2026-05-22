import { createContext, useContext } from "react";

interface SyncContextValue {
  isSyncing: boolean;
  refetch: () => void;
}

export const SyncContext = createContext<SyncContextValue>({
  isSyncing: false,
  refetch: () => {},
});

export function useSyncState(): SyncContextValue {
  return useContext(SyncContext);
}
