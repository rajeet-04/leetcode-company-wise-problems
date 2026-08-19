import type { CompanyReadiness } from "@leet-progress/analytics";
import type { ProblemIntelligence } from "@leet-progress/intelligence";
import type { AdaptivePlan, InterviewPlan } from "@leet-progress/plans";
import type { Recommendation } from "@leet-progress/recommendations";
import type { CatalogProblem } from "@leet-progress/types";
import type { ProgressMutation } from "@leet-progress/sync";
import type { HistoryReconcileState } from "./history-reconcile";
import type { SubmissionOutcome } from "./submission-observer";

export type LookupRequest = { type: "problem:lookup"; slug: string };
export type SetCurrentRequest = { type: "state:set-current"; slug: string };
export type GetCurrentRequest = { type: "state:get-current" };
export type OpenPanelRequest = { type: "panel:open" };
export type ConfigurePanelRequest = { type: "panel:configure" };
export type HistoryStartRequest = { type: "progress:history-start" };
export type HistoryStatusRequest = { type: "progress:history-status" };
export type SyncExchangeRequest = { type: "sync:exchange"; protocolVersion: number; installationId: string; knownMutationIds: string[]; mutations: ProgressMutation[] };
export type SubmissionRequest = { type: "progress:submission"; slug: string; outcome: SubmissionOutcome; fingerprint: string; observedAt: string };
export type HistoryImportRequest = { type: "progress:history-import"; slugs: string[]; observedAt: string; requestId?: string };
export type ExtensionRequest = LookupRequest | SetCurrentRequest | GetCurrentRequest | OpenPanelRequest | ConfigurePanelRequest | HistoryStartRequest | HistoryStatusRequest | SyncExchangeRequest | SubmissionRequest | HistoryImportRequest;
export type ReconcileNowMessage = { type: "progress:reconcile-now" };

export type ProblemPlanContext = { definition: InterviewPlan; adaptive: AdaptivePlan } | null;

export type ProblemPayload = {
  problem: CatalogProblem;
  intelligence: ProblemIntelligence;
  priority: ProblemIntelligence["priority"];
  recommendations: Recommendation[];
  plan: ProblemPlanContext;
  targetReadiness: CompanyReadiness[];
};

export type ExtensionResponse =
  | { ok: true; data?: ProblemPayload; slug?: string | null; installationId?: string; mutations?: ProgressMutation[]; imported?: number; history?: HistoryReconcileState }
  | { ok: false; error: string };

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  return ["problem:lookup", "state:set-current", "state:get-current", "panel:open", "panel:configure", "sync:exchange", "progress:submission", "progress:history-import", "progress:history-start", "progress:history-status"].includes(String(type));
}
