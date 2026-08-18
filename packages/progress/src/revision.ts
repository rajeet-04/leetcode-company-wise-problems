import type { ProblemProgress } from "./state";

export type RevisionSchedule = {
  intervalDays: number;
  dueAt: string;
};

function baseInterval(progress: ProblemProgress): number {
  if (progress.status === "mastered") return 30;
  switch (progress.confidence) {
    case 5: return 30;
    case 4: return 21;
    case 3: return 14;
    case 2: return 7;
    case 1: return 3;
    default: return progress.attempts >= 3 ? 5 : 10;
  }
}

export function scheduleNextRevision(progress: ProblemProgress, completedAt: string, priorityScore: number): RevisionSchedule {
  const base = baseInterval(progress);
  const multiplier = priorityScore >= 80 ? 0.5 : priorityScore >= 60 ? 0.75 : 1;
  const intervalDays = Math.max(1, Math.round(base * multiplier));
  const due = new Date(completedAt);
  if (Number.isNaN(due.getTime())) throw new Error("Invalid revision completion time");
  due.setUTCDate(due.getUTCDate() + intervalDays);
  return { intervalDays, dueAt: due.toISOString() };
}

export function isRevisionDue(progress: ProblemProgress, now: string): boolean {
  if (progress.status === "mastered" || !progress.revisionDueAt) return false;
  const due = Date.parse(progress.revisionDueAt);
  const current = Date.parse(now);
  return Number.isFinite(due) && Number.isFinite(current) && due <= current;
}
