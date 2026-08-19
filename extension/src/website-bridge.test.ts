import { afterEach, describe, expect, it, vi } from "vitest";

const APP_ORIGIN = "https://leet-progress-eta.vercel.app";

type Listener = (event: MessageEvent) => void;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("website bridge", () => {
  it("responds when a stale extension context rejects a sync request synchronously", async () => {
    let listener: Listener | undefined;
    const postMessage = vi.fn();
    const pageWindow = {
      addEventListener: vi.fn((type: string, callback: Listener) => {
        if (type === "message") listener = callback;
      }),
      postMessage,
    };

    vi.stubGlobal("location", { origin: APP_ORIGIN });
    vi.stubGlobal("window", pageWindow);
    vi.stubGlobal("chrome", {
      runtime: {
        sendMessage: () => {
          throw new Error("Extension context invalidated.");
        },
      },
    });

    await import("./website-bridge");
    listener?.({
      source: pageWindow,
      origin: APP_ORIGIN,
      data: {
        namespace: "LEET_PROGRESS_LOCAL_SYNC",
        requestId: "request-1",
        type: "sync:exchange",
      },
    } as MessageEvent);

    await vi.waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({
        namespace: "LEET_PROGRESS_LOCAL_SYNC_RESPONSE",
        requestId: "request-1",
        ok: false,
        error: "Extension bridge unavailable",
      }, APP_ORIGIN);
    });
  });
});
