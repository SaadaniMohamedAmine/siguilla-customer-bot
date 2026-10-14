import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True once the client has hydrated — avoids SSR/CSR mismatches for client-only state like next-themes. */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
