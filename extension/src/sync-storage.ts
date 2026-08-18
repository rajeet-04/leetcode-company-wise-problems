import type { ProblemProgress } from "@leet-progress/progress";
import { applyProgressMutations, mergeMutations, missingMutations, validateMutation, type ProgressMutation } from "@leet-progress/sync";

const INSTALLATION_KEY = "syncInstallationId";
const MUTATIONS_KEY = "syncMutations";
const PROGRESS_KEY = "syncProgress";

export async function getExtensionInstallationId(): Promise<string> {
  const result = await chrome.storage.local.get(INSTALLATION_KEY);
  if (typeof result[INSTALLATION_KEY] === "string") return String(result[INSTALLATION_KEY]);
  const id = `extension-${crypto.randomUUID()}`;
  await chrome.storage.local.set({ [INSTALLATION_KEY]: id });
  return id;
}

export async function getExtensionSyncState(): Promise<{ mutations: ProgressMutation[]; progress: ProblemProgress[] }> {
  const result = await chrome.storage.local.get([MUTATIONS_KEY, PROGRESS_KEY]);
  const rawMutations = Array.isArray(result[MUTATIONS_KEY]) ? result[MUTATIONS_KEY] as unknown[] : [];
  const mutations = rawMutations.filter(validateMutation);
  const progress = Array.isArray(result[PROGRESS_KEY]) ? result[PROGRESS_KEY] as ProblemProgress[] : [];
  return { mutations: mergeMutations([], mutations), progress };
}

export async function exchangeExtensionMutations(incoming: readonly ProgressMutation[], remoteKnownIds: readonly string[]) {
  const current = await getExtensionSyncState();
  const merged = mergeMutations(current.mutations, incoming);
  const progress = applyProgressMutations([], merged);
  await chrome.storage.local.set({ [MUTATIONS_KEY]: merged, [PROGRESS_KEY]: progress });
  return { mutations: merged, progress, outgoing: missingMutations(merged, remoteKnownIds) };
}

export async function appendExtensionMutation(mutation: ProgressMutation) {
  return exchangeExtensionMutations([mutation], []);
}
