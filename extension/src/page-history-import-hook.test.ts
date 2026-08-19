import { describe, expect, it, vi } from "vitest";
import { installHistoryImportHook } from "./page-history-import-hook";

describe("page history import hook", () => {
  it("installs only one request listener when retries inject the hook again", () => {
    const addEventListener = vi.fn();
    const target = {
      location: { origin: "https://leetcode.com" },
      addEventListener,
      postMessage: vi.fn(),
    };

    installHistoryImportHook(target);
    installHistoryImportHook(target);

    expect(addEventListener).toHaveBeenCalledTimes(1);
    expect(addEventListener).toHaveBeenCalledWith("message", expect.any(Function));
  });
});
