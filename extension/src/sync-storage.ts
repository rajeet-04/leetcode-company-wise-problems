import type { ProblemProgress } from "@leet-progress/progress";
import {
  applyProgressMutations,
  deriveTargetCompanies,
  mergeMutations,
  missingMutations,
  validateMutation,
  type ProgressMutation,
} from "@leet-progress/sync";

const INSTALLATION_KEY = "syncInstallationId";
const MUTATIONS_KEY = "syncMutations";
const PROGRESS_KEY = "syncProgress";
const TARGETS_KEY = "targetCompanies";

export async function getExtensionInstallationId(): Promise<string> {
  const result = await chrome.storage.local.get(INSTALLATION_KEY);
  if (typeof result[INSTALLATION_KEY] === "string") return String(result[INSTALLATION_KEY]);
  const id = `extension-${crypto.randomUUID()}`;
  await chrome.storage.local.set({ [INSTALLATION_KEY]: id });
  return id;
}

export async function getExtensionSyncState(): Promise<{ mutations: ProgressMutation[]; progress: ProblemProgress[]; targetCompanies: string[] }> {
  const result = await chrome.storage.local.get([MUTATIONS_KEY, PROGRESS_KEY, TARGETS_KEY]);
  const rawMutations = Array.isArray(result[MUTATIONS_KEY]) ? result[MUTATIONS_KEY] as unknown[] : [];
  const mutations = mergeMutations([], rawMutations.filter(validateMutation));
  const progress = Array.isArray(result[PROGRESS_KEY]) ? result[PROGRESS_KEY] as ProblemProgress[] : [];
  const fallbackTargets = Array.isArray(result[TARGETS_KEY]) ? (result[TARGETS_KEY] as unknown[]).filter((item): item is string => typeof item === "string") : [];
  return { mutations, progress, targetCompanies: deriveTargetCompanies(mutations, fallbackTargets) };
}

export async function exchangeExtensionMutations(incoming: readonly ProgressMutation[], remoteKnownIds: readonly string[]) {
  const current = await getExtensionSyncState();
  const merged = mergeMutations(current.mutations, incoming);
  const progress = applyProgressMutations([], merged);
  const targetCompanies = deriveTargetCompanies(merged, current.targetCompanies);
  await chrome.storage.local.set({ [MUTATIONS_KEY]: merged, [PROGRESS_KEY]: progress, [TARGETS_KEY]: targetCompanies });
  return { mutations: merged, progress, targetCompanies, outgoing: missingMutations(merged, remoteKnownIds) };
}

export async function appendExtensionMutation(mutation: ProgressMutation) {
  return exchangeExtensionMutations([mutation], []);
}
