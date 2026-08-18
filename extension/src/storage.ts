const CURRENT_SLUG_KEY = "currentProblemSlug";
const TARGETS_KEY = "targetCompanies";

export async function getCurrentProblemSlug(): Promise<string | null> {
  const result = await chrome.storage.local.get(CURRENT_SLUG_KEY);
  return typeof result[CURRENT_SLUG_KEY] === "string" ? String(result[CURRENT_SLUG_KEY]) : null;
}

export async function setCurrentProblemSlug(slug: string): Promise<void> {
  await chrome.storage.local.set({ [CURRENT_SLUG_KEY]: slug });
}

export async function getTargetCompanies(): Promise<string[]> {
  const result = await chrome.storage.local.get(TARGETS_KEY);
  const value = result[TARGETS_KEY];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}
