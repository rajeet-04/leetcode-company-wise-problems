import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { toFirefoxManifest, type ChromiumManifest } from "../src/manifest-transform";

const extensionRoot = path.resolve(import.meta.dir, "..");
const repoRoot = path.resolve(extensionRoot, "..");
const target = process.argv[2] === "firefox" ? "firefox" : "chromium";
const outdir = path.join(extensionRoot, target === "firefox" ? "dist-firefox" : "dist");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const entryNames = ["content", "service-worker", "popup", "sidepanel", "website-bridge", "page-submission-hook"];
if (target === "firefox") entryNames.push("page-hook-loader");

const result = await Bun.build({
  entrypoints: entryNames.map((name) => path.join(extensionRoot, `src/${name}.ts`)),
  outdir,
  target: "browser",
  format: "iife",
  sourcemap: "none",
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}

for (const file of ["popup.html", "sidepanel.html", "content.css", "ui.css"]) {
  await copyFile(path.join(extensionRoot, file), path.join(outdir, file));
}

if (target === "firefox") {
  const source = JSON.parse(await readFile(path.join(extensionRoot, "manifest.json"), "utf8")) as ChromiumManifest;
  const manifest = toFirefoxManifest(source);
  await writeFile(path.join(outdir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
} else {
  await copyFile(path.join(extensionRoot, "manifest.json"), path.join(outdir, "manifest.json"));
}

await copyFile(path.join(repoRoot, "artifacts/catalog/extension-catalog.json"), path.join(outdir, "catalog.json"));
console.log(`${target} extension built to ${outdir}`);
