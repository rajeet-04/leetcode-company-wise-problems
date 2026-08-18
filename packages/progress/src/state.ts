export type ProgressStatus = "unseen" | "attempted" | "solved" | "revision_due" | "mastered";

export type ProblemProgress = {
  slug: string;
  status: ProgressStatus;
  attempts: number;
  revisitCount: number;
  firstSeenAt?: string;
  lastAttemptAt?: string;
  solvedAt?: string;
  masteredAt?: string;
  revisionDueAt?: string;
  confidence?: 1 | 2 | 3 | 4 | 5;
  note?: string;
};

export type ProgressEvent =
  | { type: "ATTEMPT"; slug: string; at: string }
  | { type: "SOLVE"; slug: string; at: string }
  | { type: "REVISION_DUE"; slug: string; at: string; dueAt: string }
  | { type: "REVISIT"; slug: string; at: string }
  | { type: "MASTER"; slug: string; at: string }
  | { type: "SET_CONFIDENCE"; slug: string; at: string; confidence: 1 | 2 | 3 | 4 | 5 }
  | { type: "SET_NOTE"; slug: string; at: string; note: string }
  | { type: "SET_STATUS"; slug: string; at: string; status: ProgressStatus };

export function createProgress(slug: string, at?: string): ProblemProgress {
  return {
    slug,
    status: "unseen",
    attempts: 0,
    revisitCount: 0,
    ...(at ? { firstSeenAt: at } : {}),
  };
}

export function reduceProgress(
  current: ProblemProgress | undefined,
  event: ProgressEvent,
): ProblemProgress {
  const base = current ? { ...current } : createProgress(event.slug, event.at);

  switch (event.type) {
    case "ATTEMPT":
      return {
        ...base,
        status: base.status === "unseen" ? "attempted" : base.status,
        attempts: base.attempts + 1,
        lastAttemptAt: event.at,
      };
    case "SOLVE":
      return {
        ...base,
        status: "solved",
        attempts: Math.max(1, base.attempts),
        lastAttemptAt: event.at,
        solvedAt: base.solvedAt ?? event.at,
      };
    case "REVISION_DUE":
      return { ...base, status: "revision_due", revisionDueAt: event.dueAt };
    case "REVISIT":
      return { ...base, revisitCount: base.revisitCount + 1, lastAttemptAt: event.at };
    case "MASTER":
      return { ...base, status: "mastered", masteredAt: event.at, revisionDueAt: undefined };
    case "SET_CONFIDENCE":
      return { ...base, confidence: event.confidence };
    case "SET_NOTE":
      return { ...base, note: event.note };
    case "SET_STATUS":
      return { ...base, status: event.status };
  }
}
