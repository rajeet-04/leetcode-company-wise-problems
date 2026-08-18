import type { CatalogProblem } from "@leet-progress/types";
import type { ScoreResult } from "@leet-progress/intelligence";
import type { ProgressMutation } from "@leet-progress/sync";
import type { SubmissionOutcome } from "./submission-observer";

export type LookupRequest = { type: "problem:lookup"; slug: string };
export type SetCurrentRequest = { type: "state:set-current"; slug: string };
export type GetCurrentRequest = { type: "state:get-current" };
export type OpenPanelRequest = { type: "panel:open" };
export type SyncExchangeRequest = { type: "sync:exchange"; protocolVersion: number; installationId: string; knownMutationIds: string[]; mutations: ProgressMutation[] };
export type SubmissionRequest = { type: "progress:submission"; slug: string; outcome: SubmissionOutcome; fingerprint: string; observedAt: string };
export type ExtensionRequest = LookupRequest | SetCurrentRequest | GetCurrentRequest | OpenPanelRequest | SyncExchangeRequest | SubmissionRequest;

export type ProblemPayload = { problem: CatalogProblem; priority: ScoreResult };
export type ExtensionResponse =
  | { ok: true; data?: ProblemPayload; slug?: string | null; installationId?: string; mutations?: ProgressMutation[] }
  | { ok: false; error: string };

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  return ["problem:lookup", "state:set-current", "state:get-current", "panel:open", "sync:exchange", "progress:submission"].includes(String(type));
}
