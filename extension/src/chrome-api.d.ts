declare const chrome: {
  runtime: {
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: { addListener(listener: (message: unknown, sender: { tab?: { id?: number } }, sendResponse: (response: unknown) => void) => boolean | void): void };
    onInstalled: { addListener(listener: () => void): void };
  };
  storage: {
    local: {
      get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      setAccessLevel(options: { accessLevel: "TRUSTED_CONTEXTS" | "TRUSTED_AND_UNTRUSTED_CONTEXTS" }): Promise<void>;
    };
  };
  sidePanel: { open(options: { tabId: number }): Promise<void> };
};
