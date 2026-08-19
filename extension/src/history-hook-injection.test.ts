import { describe, expect, it, vi } from "vitest";
import { injectHistoryHook } from "./history-hook-injection";

describe("history hook injection", () => {
  it("executes the history collector in the LeetCode page main world", async () => {
    const executeScript = vi.fn().mockResolvedValue([]);

    await injectHistoryHook(42, { executeScript });

    expect(executeScript).toHaveBeenCalledWith({
      target: { tabId: 42 },
      files: ["page-history-import-hook.js"],
      world: "MAIN",
    });
  });
});
