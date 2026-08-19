import { describe, expect, it } from "vitest";
import { nextLauncherMode } from "./launcher-state";

describe("launcher state", () => {
  it("starts expanded and minimizes on explicit actions", () => {
    expect(nextLauncherMode("expanded", "minimize")).toBe("minimized");
    expect(nextLauncherMode("expanded", "panel-opened")).toBe("minimized");
  });
  it("restores from the compact launcher", () => {
    expect(nextLauncherMode("minimized", "restore")).toBe("expanded");
    expect(nextLauncherMode("minimized", "minimize")).toBe("minimized");
  });
});
