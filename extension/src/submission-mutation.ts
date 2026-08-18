import { SYNC_PROTOCOL_VERSION, SYNC_SCHEMA_VERSION, type ProgressMutation } from "@leet-progress/sync";
import type { SubmissionOutcome } from "./submission-observer";

export function createSubmissionMutation(input: {
  slug: string;
  outcome: SubmissionOutcome;
  fingerprint: string;
  installationId: string;
  at: string;
}): ProgressMutation {
  const solved = input.outcome.kind === "accepted";
  return {
    protocolVersion: SYNC_PROTOCOL_VERSION,
    schemaVersion: SYNC_SCHEMA_VERSION,
    mutationId: `extension:submission:${input.fingerprint}:${solved ? "solved" : "attempt"}`,
    installationId: input.installationId,
    source: "extension",
    type: solved ? "PROBLEM_SOLVED" : "PROBLEM_ATTEMPTED",
    occurredAt: input.at,
    payload: { slug: input.slug },
  } as ProgressMutation;
}
