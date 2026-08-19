export async function restrictExtensionStorageAccess(): Promise<void> {
  if (chrome.storage.local.setAccessLevel) {
    await chrome.storage.local.setAccessLevel({ accessLevel: "TRUSTED_CONTEXTS" });
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
