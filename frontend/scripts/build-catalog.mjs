import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const cliPath = path.resolve(frontendDir, "..", "packages", "catalog", "src", "cli.ts");

const result = spawnSync("bun", [cliPath], {
  cwd: frontendDir,
  stdio: "inherit",
  shell: process.platform === "win32",
});

if (result.error) throw result.error;
process.exit(result.status ?? 1);
