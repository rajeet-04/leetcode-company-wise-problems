export type LauncherMode = "expanded" | "minimized";
export type LauncherEvent = "minimize" | "panel-opened" | "restore";

export function nextLauncherMode(mode: LauncherMode, event: LauncherEvent): LauncherMode {
  if (event === "restore") return "expanded";
  if (event === "minimize" || event === "panel-opened") return "minimized";
  return mode;
}
