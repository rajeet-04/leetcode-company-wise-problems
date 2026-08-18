import type { CatalogProblem } from "@leet-progress/types";
import type { ScoreResult } from "@leet-progress/intelligence";

export type LookupRequest = { type: "problem:lookup"; slug: string };
export type SetCurrentRequest = { type: "state:set-current"; slug: string };
export type GetCurrentRequest = { type: "state:get-current" };
export type OpenPanelRequest = { type: "panel:open" };
export type ExtensionRequest = LookupRequest | SetCurrentRequest | GetCurrentRequest | OpenPanelRequest;

export type ProblemPayload = { problem: CatalogProblem; priority: ScoreResult };
export type ExtensionResponse =
  | { ok: true; data?: ProblemPayload; slug?: string | null }
  | { ok: false; error: string };

export function isExtensionRequest(value: unknown): value is ExtensionRequest {
  if (!value || typeof value !== "object" || !("type" in value)) return false;
  const type = (value as { type?: unknown }).type;
  return type === "problem:lookup" || type === "state:set-current" || type === "state:get-current" || type === "panel:open";
}
