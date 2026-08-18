"use client";

import { useEffect } from "react";
import { SYNC_PROTOCOL_VERSION, validateMutation, type ProgressMutation } from "@leet-progress/sync";
import { useProgress } from "./progress-provider";

const REQUEST_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC";
const RESPONSE_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC_RESPONSE";

export function LocalSyncBridge() {
  const { ready, installationId, mutations, applyRemoteMutations } = useProgress();

  useEffect(() => {
    if (!ready || !installationId || typeof window === "undefined") return;
    let stopped = false;
    let activeRequestId: string | null = null;

    const onMessage = (event: MessageEvent) => {
      if (event.source !== window || event.origin !== window.location.origin) return;
      const data = event.data as { namespace?: unknown; requestId?: unknown; ok?: unknown; mutations?: unknown };
      if (data?.namespace !== RESPONSE_NAMESPACE || data.requestId !== activeRequestId || data.ok !== true) return;
      const incoming = Array.isArray(data.mutations) ? data.mutations.filter(validateMutation) : [];
      if (incoming.length) applyRemoteMutations(incoming as ProgressMutation[]);
      activeRequestId = null;
    };

    const exchange = () => {
      if (stopped || activeRequestId) return;
      const requestId = crypto.randomUUID();
      activeRequestId = requestId;
      window.postMessage({
        namespace: REQUEST_NAMESPACE,
        requestId,
        type: "sync:exchange",
        protocolVersion: SYNC_PROTOCOL_VERSION,
        installationId,
        knownMutationIds: mutations.map((mutation) => mutation.mutationId),
        mutations,
      }, window.location.origin);
      window.setTimeout(() => { if (activeRequestId === requestId) activeRequestId = null; }, 1500);
    };

    window.addEventListener("message", onMessage);
    exchange();
    const timer = window.setInterval(exchange, 2000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
      window.removeEventListener("message", onMessage);
    };
  }, [applyRemoteMutations, installationId, mutations, ready]);

  return null;
}
