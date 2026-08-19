"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { SYNC_PROTOCOL_VERSION, validateMutation, type ProgressMutation } from "@leet-progress/sync";
import { deriveSyncDiagnostics, type SyncDiagnostics } from "@leet-progress/sync/diagnostics";
import { useProgress } from "./progress-provider";

const REQUEST_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC";
const RESPONSE_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC_RESPONSE";

type LocalSyncContextValue = {
  diagnostics: SyncDiagnostics;
  syncNow(): void;
};

const LocalSyncContext = createContext<LocalSyncContextValue | null>(null);

export function LocalSyncProvider({ children }: { children: ReactNode }) {
  const { ready, installationId, mutations, applyRemoteMutations } = useProgress();
  const [lastAttemptAt, setLastAttemptAt] = useState<string | null>(null);
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [clock, setClock] = useState("1970-01-01T00:00:00.000Z");
  const exchangeRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!ready || !installationId || typeof window === "undefined") {
      exchangeRef.current = () => {};
      return;
    }

    let stopped = false;
    let activeRequestId: string | null = null;

    const stamp = () => {
      const value = new Date().toISOString();
      setClock(value);
      return value;
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as { namespace?: unknown; requestId?: unknown; ok?: unknown; mutations?: unknown };
      if (data?.namespace !== RESPONSE_NAMESPACE || data.requestId !== activeRequestId) return;

      activeRequestId = null;
      const at = stamp();
      if (data.ok !== true) {
        setLastError("bridge-rejected");
        return;
      }

      const incoming = Array.isArray(data.mutations) ? data.mutations.filter(validateMutation) : [];
      if (incoming.length) applyRemoteMutations(incoming as ProgressMutation[]);
      setLastSuccessAt(at);
      setLastError(null);
    };

    const exchange = () => {
      if (stopped || activeRequestId) return;
      const requestId = crypto.randomUUID();
      const at = stamp();
      activeRequestId = requestId;
      setLastAttemptAt(at);
      window.postMessage({
        namespace: REQUEST_NAMESPACE,
        requestId,
        type: "sync:exchange",
        protocolVersion: SYNC_PROTOCOL_VERSION,
        installationId,
        knownMutationIds: mutations.map((mutation) => mutation.mutationId),
        mutations,
      }, window.location.origin);

      window.setTimeout(() => {
        if (stopped || activeRequestId !== requestId) return;
        activeRequestId = null;
        stamp();
        setLastError("bridge-timeout");
      }, 1500);
    };

    exchangeRef.current = exchange;
    window.addEventListener("message", onMessage);
    exchange();
    const timer = window.setInterval(exchange, 2000);

    return () => {
      stopped = true;
      exchangeRef.current = () => {};
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [applyRemoteMutations, installationId, mutations, ready]);

  const diagnostics = useMemo(
    () => deriveSyncDiagnostics({ lastAttemptAt, lastSuccessAt, lastError, pendingMutations: mutations.length }, clock),
    [clock, lastAttemptAt, lastError, lastSuccessAt, mutations.length],
  );
  const syncNow = useCallback(() => exchangeRef.current(), []);
  const value = useMemo(() => ({ diagnostics, syncNow }), [diagnostics, syncNow]);

  return <LocalSyncContext.Provider value={value}>{children}</LocalSyncContext.Provider>;
}

export function useLocalSync(): LocalSyncContextValue {
  const value = useContext(LocalSyncContext);
  if (!value) throw new Error("useLocalSync must be used inside LocalSyncProvider");
  return value;
}
