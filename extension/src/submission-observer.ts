export type SubmissionOutcome =
  | { kind: "accepted"; reason: "Accepted" }
  | { kind: "failed"; reason: string };

type ExecutionSource = "submit" | "run";

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

function executionSourceFromUrl(url: string): ExecutionSource | null {
  if (/\/problems\/[^/?#]+\/interpret_solution(?:\/|\?|#|$)/i.test(url)) return "run";
  if (/\/problems\/[^/?#]+\/submit(?:\/|\?|#|$)/i.test(url)) return "submit";
  return null;
}

function pollJudgeIdFromUrl(url: string): string | null {
  const match = url.match(/\/submissions\/detail\/([^/?#]+)\/check(?:\/|\?|#|$)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
}

function executionId(value: unknown, source: ExecutionSource): string | null {
  const payload = record(value);
  if (!payload) return null;
  const candidates = source === "submit"
    ? [payload.submission_id, payload.submissionId, payload.id]
    : [payload.interpret_id, payload.interpretId, payload.submission_id, payload.submissionId, payload.id];
  const id = candidates.find((candidate) => typeof candidate === "string" || typeof candidate === "number");
  return typeof id === "string" || typeof id === "number" ? String(id) : null;
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

export function isSubmissionLifecycleUrl(url: string): boolean {
  return executionSourceFromUrl(url) !== null || pollJudgeIdFromUrl(url) !== null;
}

export function createSubmissionResponseTracker() {
  const sourceByJudgeId = new Map<string, ExecutionSource>();

  return {
    inspect(url: string, payload: unknown): SubmissionOutcome | null {
      const source = executionSourceFromUrl(url);
      if (source) {
        const id = executionId(payload, source);
        if (id) sourceByJudgeId.set(id, source);

        if (source === "run") return null;
        const outcome = classifySubmissionPayload(payload);
        if (outcome && id) sourceByJudgeId.delete(id);
        return outcome;
      }

      const judgeId = pollJudgeIdFromUrl(url);
      if (!judgeId) return null;
      const trackedSource = sourceByJudgeId.get(judgeId);
      if (!trackedSource) return null;

      const outcome = classifySubmissionPayload(payload);
      if (!outcome) return null;
      sourceByJudgeId.delete(judgeId);
      return trackedSource === "submit" ? outcome : null;
    },
  };
}

export function isLikelySubmissionResponseUrl(url: string): boolean {
  return /\/(submissions?|check|submit|interpret_solution)(?:\/|\?|$)/i.test(url);
}
