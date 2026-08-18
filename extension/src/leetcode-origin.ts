export const LEETCODE_ORIGIN = "https://leetcode.com";
export function isAllowedLeetCodeUrl(url: string | undefined): boolean {
  if (!url) return false;
  try { return new URL(url).origin === LEETCODE_ORIGIN; }
  catch { return false; }
}
