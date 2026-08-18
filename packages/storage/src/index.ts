import type { ProblemProgress } from "@leet-progress/progress";

export const STORAGE_PACKAGE_VERSION = 1 as const;

export interface KeyValueStore<T> {
  get(key: string): Promise<T | undefined>;
  set(key: string, value: T): Promise<void>;
  delete(key: string): Promise<void>;
  entries(): Promise<Array<[string, T]>>;
}

export interface ProgressStore {
  getProblem(slug: string): Promise<ProblemProgress | undefined>;
  putProblem(progress: ProblemProgress): Promise<void>;
  deleteProblem(slug: string): Promise<void>;
  listProblems(): Promise<ProblemProgress[]>;
}

export type UserPreferences = {
  targetCompanies: string[];
  dailyProblemGoal?: number;
};

export interface PreferencesStore {
  getPreferences(): Promise<UserPreferences>;
  putPreferences(preferences: UserPreferences): Promise<void>;
}

export type MutationRecord<T = unknown> = {
  protocolVersion: 1;
  mutationId: string;
  installationId: string;
  source: "web" | "extension";
  type: string;
  occurredAt: string;
  schemaVersion: number;
  payload: T;
};

export interface MutationStore {
  append(mutation: MutationRecord): Promise<void>;
  has(mutationId: string): Promise<boolean>;
  listAfter(cursor?: string): Promise<MutationRecord[]>;
}
