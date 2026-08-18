export type SubmissionOutcome =
  | { kind: "accepted"; reason: "Accepted" }
  | { kind: "failed"; reason: string };

const FAILURE_MESSAGES = new Set([
  "Wrong Answer",
  "Time Limit Exceeded",
  "Memory Limit Exceeded",
  "Runtime Error",
  "Compile Error",
  "Output Limit Exceeded",
  "Internal Error",
]);

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function classifySubmissionPayload(value: unknown): SubmissionOutcome | null {
  const payload = record(value);
  if (!payload || typeof payload.status_msg !== "string") return null;
  const status = payload.status_msg.trim();
  if (status === "Accepted") return { kind: "accepted", reason: "Accepted" };
  if (FAILURE_MESSAGES.has(status)) return { kind: "failed", reason: status };
  return null;
}

export function submissionFingerprint(value: unknown): string {
  const payload = record(value) ?? {};
  const id = payload.submission_id ?? payload.submissionId ?? payload.id;
  if (typeof id === "string" || typeof id === "number") return `submission:${String(id)}`;
  const finished = payload.task_finish_time ?? payload.timestamp ?? "unknown";
  const status = typeof payload.status_msg === "string" ? payload.status_msg.trim() : "unknown";
  const runtime = payload.runtime ?? "";
  const memory = payload.memory ?? "";
  return `submission:${String(finished)}:${status}:${String(runtime)}:${String(memory)}`;
}

export function isLikelySubmissionResponseUrl(url: string): boolean {
  return /\/(submissions?|check|submit|interpret_solution)(?:\/|\?|$)/i.test(url);
}
