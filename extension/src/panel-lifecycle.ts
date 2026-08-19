export type PanelOptions = { enabled: boolean; path?: "sidepanel.html" };

export function panelOptionsForUrl(url: string | undefined): PanelOptions {
  if (!url) return { enabled: false };
  try {
    return new URL(url).origin === "https://leetcode.com"
      ? { enabled: true, path: "sidepanel.html" }
      : { enabled: false };
  } catch {
    return { enabled: false };
  }
}
