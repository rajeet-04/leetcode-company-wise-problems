declare const chrome: {
  runtime: {
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: { addListener(listener: (message: unknown, sender: { tab?: { id?: number }; url?: string }, sendResponse: (response: unknown) => void) => boolean | void): void };
    onInstalled: { addListener(listener: () => void): void };
    onStartup: { addListener(listener: () => void): void };
  };
  storage: {
    local: {
      get(keys?: string | string[] | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      setAccessLevel?: (options: { accessLevel: "TRUSTED_CONTEXTS" | "TRUSTED_AND_UNTRUSTED_CONTEXTS" }) => Promise<void>;
    };
    onChanged: {
      addListener(listener: (changes: Record<string, { oldValue?: unknown; newValue?: unknown }>, areaName: string) => void): void;
    };
  };
  alarms: {
    get(name: string): Promise<{ name: string } | undefined>;
    create(name: string, alarmInfo: { delayInMinutes?: number; periodInMinutes?: number }): Promise<void>;
    onAlarm: { addListener(listener: (alarm: { name: string }) => void): void };
  };
  sidePanel?: {
    open(options: { tabId: number }): Promise<void>;
    setOptions(options: { tabId?: number; path?: string; enabled?: boolean }): Promise<void>;
  };
  sidebarAction?: { open(): Promise<void> };
};
