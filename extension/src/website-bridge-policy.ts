export const LEET_PROGRESS_WEBSITE_ORIGIN = "https://leet.rajeet.in";
export const SYNC_REQUEST_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC";
export const SYNC_RESPONSE_NAMESPACE = "LEET_PROGRESS_LOCAL_SYNC_RESPONSE";

export function isAllowedWebsiteUrl(url: string | undefined): boolean {
  if (!url) return false;
  try { return new URL(url).origin === LEET_PROGRESS_WEBSITE_ORIGIN; }
  catch { return false; }
}
