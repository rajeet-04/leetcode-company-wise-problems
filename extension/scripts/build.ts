import { copyFile, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const extensionRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(extensionRoot, "..");
const outdir = path.join(extensionRoot, "dist");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const result = await Bun.build({
  entrypoints: ["content", "service-worker", "popup", "sidepanel", "website-bridge"].map((name) => path.join(extensionRoot, `src/${name}.ts`)),
  outdir,
  target: "browser",
  format: "iife",
  sourcemap: "none",
});
if (!result.success) { for (const log of result.logs) console.error(log); process.exit(1); }
for (const file of ["manifest.json", "popup.html", "sidepanel.html", "content.css", "ui.css"]) await copyFile(path.join(extensionRoot, file), path.join(outdir, file));
await copyFile(path.join(repoRoot, "artifacts/catalog/extension-catalog.json"), path.join(outdir, "catalog.json"));
console.log(`Extension built to ${outdir}`);
