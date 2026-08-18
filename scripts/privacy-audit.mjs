import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = ["frontend", "extension", "packages"].map((name) => path.join(root, name));
const forbidden = [
  { label: "chrome.storage.sync usage", pattern: /chrome\.storage\.sync\s*\./ },
  { label: "Supabase client import", pattern: /from\s+["'][^"']*supabase[^"']*["']/i },
  { label: "Firebase client import", pattern: /from\s+["'][^"']*firebase[^"']*["']/i },
  { label: "remote user progress API", pattern: /\/api\/(?:user[-_]?progress|progress[-_]?sync|user[-_]?profile)/i },
];
const allowedExtensions = new Set([".ts", ".tsx", ".js", ".mjs", ".json"]);
const ignoredDirs = new Set(["node_modules", ".next", "dist", "data"]);
const issues = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    if (!allowedExtensions.has(path.extname(entry.name)) || entry.name.includes(".test.")) continue;
    const source = fs.readFileSync(full, "utf8");
    for (const rule of forbidden) if (rule.pattern.test(source)) issues.push(`${path.relative(root, full)}: ${rule.label}`);
  }
}

for (const directory of roots) if (fs.existsSync(directory)) walk(directory);
if (issues.length) {
  console.error("Local-first privacy audit failed:\n" + issues.join("\n"));
  process.exit(1);
}
console.log("Local-first privacy audit passed: no forbidden user-data cloud paths found.");
