type HistoryScriptingApi = {
  executeScript(injection: {
    target: { tabId: number };
    files: string[];
    world: "MAIN";
  }): Promise<unknown>;
};

export async function injectHistoryHook(tabId: number, scripting: HistoryScriptingApi = chrome.scripting): Promise<void> {
  await scripting.executeScript({
    target: { tabId },
    files: ["page-history-import-hook.js"],
    world: "MAIN",
  });
}
