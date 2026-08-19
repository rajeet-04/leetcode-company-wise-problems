import { panelOptionsForUrl } from "./panel-lifecycle";

export async function restrictExtensionStorageAccess(): Promise<void> {
  if (chrome.storage.local.setAccessLevel) {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
  }
}

export async function disableGlobalExtensionPanel(): Promise<void> {
  if (chrome.sidePanel?.setOptions) {
    await chrome.sidePanel.setOptions({ enabled: false });
  }
}

export async function configureExtensionPanel(tabId: number, url: string | undefined): Promise<void> {
  if (chrome.sidePanel?.setOptions) {
    await chrome.sidePanel.setOptions({ tabId, ...panelOptionsForUrl(url) });
  }
}

export async function openExtensionPanel(tabId: number | undefined): Promise<void> {
  if (tabId && chrome.sidePanel?.open) {
    await chrome.sidePanel.open({ tabId });
    return;
  }
  if (chrome.sidebarAction?.open) {
    await chrome.sidebarAction.open();
    return;
  }
  throw new Error("No supported extension panel API is available");
}
