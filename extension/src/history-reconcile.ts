export const HISTORY_RECONCILE_STORAGE_KEY = "leetProgressHistoryReconcile";

export type HistoryReconcileState = {
  needed: boolean;
  lastReconciledAt: string | null;
  lastSolvedCount: number | null;
};

export const DEFAULT_HISTORY_RECONCILE_STATE: HistoryReconcileState = {
  needed: true,
  lastReconciledAt: null,
  lastSolvedCount: null,
};

export function normalizeHistoryReconcileState(value: unknown): HistoryReconcileState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...DEFAULT_HISTORY_RECONCILE_STATE };
  const raw = value as Record<string, unknown>;
  const lastReconciledAt = typeof raw.lastReconciledAt === "string" && !Number.isNaN(Date.parse(raw.lastReconciledAt))
    ? raw.lastReconciledAt
    : null;
  const lastSolvedCount = typeof raw.lastSolvedCount === "number" && Number.isInteger(raw.lastSolvedCount) && raw.lastSolvedCount >= 0
    ? raw.lastSolvedCount
    : null;
  return {
    needed: typeof raw.needed === "boolean" ? raw.needed : true,
    lastReconciledAt,
    lastSolvedCount,
  };
}

export function markHistoryReconcileNeeded(state: HistoryReconcileState): HistoryReconcileState {
  return { ...state, needed: true };
}

export function markHistoryReconcileSuccess(state: HistoryReconcileState, at: string, solvedCount: number): HistoryReconcileState {
  return { ...state, needed: false, lastReconciledAt: at, lastSolvedCount: solvedCount };
}

export async function getHistoryReconcileState(): Promise<HistoryReconcileState> {
  const stored = await chrome.storage.local.get(HISTORY_RECONCILE_STORAGE_KEY);
  return normalizeHistoryReconcileState(stored[HISTORY_RECONCILE_STORAGE_KEY]);
}

export async function setHistoryReconcileNeeded(): Promise<HistoryReconcileState> {
  const next = markHistoryReconcileNeeded(await getHistoryReconcileState());
  await chrome.storage.local.set({ [HISTORY_RECONCILE_STORAGE_KEY]: next });
  return next;
}

export async function setHistoryReconcileSuccess(at: string, solvedCount: number): Promise<HistoryReconcileState> {
  const next = markHistoryReconcileSuccess(await getHistoryReconcileState(), at, solvedCount);
  await chrome.storage.local.set({ [HISTORY_RECONCILE_STORAGE_KEY]: next });
  return next;
}
