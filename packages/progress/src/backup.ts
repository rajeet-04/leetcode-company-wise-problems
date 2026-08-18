import type { ProblemProgress } from "./state";
import { PROGRESS_SCHEMA_VERSION } from "./migration";

export const BACKUP_FORMAT_VERSION = 1 as const;

export type BackupPreferences = {
  targetCompanies: string[];
  dailyProblemGoal?: number;
};

export type LeetProgressBackup = {
  format: "leet-progress-backup";
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  progressSchemaVersion: typeof PROGRESS_SCHEMA_VERSION;
  exportedAt: string;
  progress: ProblemProgress[];
  preferences: BackupPreferences;
};

export type ImportMode = "merge" | "replace";

export function createBackup(
  progress: readonly ProblemProgress[],
  preferences: BackupPreferences,
  exportedAt: string,
): LeetProgressBackup {
  return {
    format: "leet-progress-backup",
    formatVersion: BACKUP_FORMAT_VERSION,
    progressSchemaVersion: PROGRESS_SCHEMA_VERSION,
    exportedAt,
    progress: [...progress].map((item) => ({ ...item })).sort((a, b) => a.slug.localeCompare(b.slug)),
    preferences: {
      targetCompanies: [...new Set(preferences.targetCompanies)].sort((a, b) => a.localeCompare(b)),
      ...(preferences.dailyProblemGoal === undefined ? {} : { dailyProblemGoal: preferences.dailyProblemGoal }),
    },
  };
}

export function parseBackup(value: unknown): LeetProgressBackup {
  if (!value || typeof value !== "object") throw new Error("Backup must be an object");
  const candidate = value as Partial<LeetProgressBackup>;
  if (candidate.format !== "leet-progress-backup") throw new Error("Unsupported backup format");
  if (candidate.formatVersion !== BACKUP_FORMAT_VERSION) throw new Error("Unsupported backup format version");
  if (candidate.progressSchemaVersion !== PROGRESS_SCHEMA_VERSION) throw new Error("Unsupported progress schema version");
  if (!Array.isArray(candidate.progress)) throw new Error("Backup progress must be an array");
  if (!candidate.preferences || !Array.isArray(candidate.preferences.targetCompanies)) throw new Error("Backup preferences are invalid");

  const slugs = new Set<string>();
  for (const item of candidate.progress) {
    if (!item || typeof item.slug !== "string" || !item.slug.trim()) throw new Error("Backup contains invalid progress");
    if (slugs.has(item.slug)) throw new Error(`Backup contains duplicate slug: ${item.slug}`);
    slugs.add(item.slug);
  }
  return candidate as LeetProgressBackup;
}

export function applyBackup(
  currentProgress: readonly ProblemProgress[],
  currentPreferences: BackupPreferences,
  backup: LeetProgressBackup,
  mode: ImportMode,
): { progress: ProblemProgress[]; preferences: BackupPreferences } {
  if (mode === "replace") {
    return {
      progress: backup.progress.map((item) => ({ ...item })).sort((a, b) => a.slug.localeCompare(b.slug)),
      preferences: { ...backup.preferences, targetCompanies: [...backup.preferences.targetCompanies] },
    };
  }

  const merged = new Map(currentProgress.map((item) => [item.slug, { ...item }]));
  for (const item of backup.progress) {
    const current = merged.get(item.slug);
    if (!current) {
      merged.set(item.slug, { ...item });
      continue;
    }
    const currentTime = current.lastAttemptAt ?? current.solvedAt ?? current.masteredAt ?? current.firstSeenAt ?? "";
    const importedTime = item.lastAttemptAt ?? item.solvedAt ?? item.masteredAt ?? item.firstSeenAt ?? "";
    if (importedTime > currentTime) merged.set(item.slug, { ...item });
  }

  return {
    progress: [...merged.values()].sort((a, b) => a.slug.localeCompare(b.slug)),
    preferences: {
      targetCompanies: [...new Set([...currentPreferences.targetCompanies, ...backup.preferences.targetCompanies])].sort((a, b) => a.localeCompare(b)),
      dailyProblemGoal: backup.preferences.dailyProblemGoal ?? currentPreferences.dailyProblemGoal,
    },
  };
}
