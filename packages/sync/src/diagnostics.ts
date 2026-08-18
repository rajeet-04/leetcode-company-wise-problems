export type SyncDiagnosticInput = {
  lastAttemptAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
  pendingMutations: number;
};

export type SyncDiagnostics = SyncDiagnosticInput & {
  state: "checking" | "connected" | "unavailable" | "error";
};

export function deriveSyncDiagnostics(input: SyncDiagnosticInput, now: string): SyncDiagnostics {
  const nowMs = Date.parse(now);
  const attemptMs = input.lastAttemptAt ? Date.parse(input.lastAttemptAt) : Number.NaN;
  const successMs = input.lastSuccessAt ? Date.parse(input.lastSuccessAt) : Number.NaN;
  let state: SyncDiagnostics["state"] = "checking";
  if (input.lastError && (!Number.isFinite(successMs) || !Number.isFinite(attemptMs) || attemptMs >= successMs)) state = "error";
  else if (Number.isFinite(successMs)) state = "connected";
  else if (Number.isFinite(attemptMs) && Number.isFinite(nowMs) && nowMs - attemptMs >= 5_000) state = "unavailable";
  return { ...input, pendingMutations: Math.max(0, input.pendingMutations), state };
}
