import { access, copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { toFirefoxManifest, type ChromiumManifest } from "../src/manifest-transform";

const extensionRoot = path.resolve(import.meta.dir, "..");
const sourceRoot = path.join(extensionRoot, "src");
const repoRoot = path.resolve(extensionRoot, "..");
const target = process.argv[2] === "firefox" ? "firefox" : "chromium";
const outdir = path.join(extensionRoot, target === "firefox" ? "dist-firefox" : "dist");

await rm(outdir, { recursive: true, force: true });
await mkdir(outdir, { recursive: true });

const entryNames = [
  "content",
  "panel-scope",
  "service-worker",
  "popup",
  "sidepanel",
  "website-bridge",
  "page-submission-hook",
  "progress-import",
  "page-history-import-hook",
  "page-history-hook-loader",
];
if (target === "firefox") entryNames.push("page-hook-loader");

const result = await Bun.build({
  entrypoints: entryNames.map((name) => path.join(sourceRoot, `${name}.ts`)),
  outdir,
  root: sourceRoot,
  naming: "[name].[ext]",
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

async function assertBuiltFile(relativePath: string) {
  const normalized = relativePath.replaceAll("/", path.sep);
  try {
    await access(path.join(outdir, normalized));
  } catch {
    throw new Error(`${target} extension manifest references missing build artifact: ${relativePath}`);
  }
}

const builtManifest = JSON.parse(await readFile(path.join(outdir, "manifest.json"), "utf8")) as {
  background?: { service_worker?: string; scripts?: string[] };
  action?: { default_popup?: string };
  side_panel?: { default_path?: string };
  sidebar_action?: { default_panel?: string };
  content_scripts?: Array<{ js?: string[]; css?: string[] }>;
  web_accessible_resources?: Array<{ resources?: string[] }>;
};

const referencedFiles = new Set<string>();
if (builtManifest.background?.service_worker) referencedFiles.add(builtManifest.background.service_worker);
for (const script of builtManifest.background?.scripts ?? []) referencedFiles.add(script);
if (builtManifest.action?.default_popup) referencedFiles.add(builtManifest.action.default_popup);
if (builtManifest.side_panel?.default_path) referencedFiles.add(builtManifest.side_panel.default_path);
if (builtManifest.sidebar_action?.default_panel) referencedFiles.add(builtManifest.sidebar_action.default_panel);
for (const script of builtManifest.content_scripts ?? []) {
  for (const file of script.js ?? []) referencedFiles.add(file);
  for (const file of script.css ?? []) referencedFiles.add(file);
}
for (const resource of builtManifest.web_accessible_resources ?? []) {
  for (const file of resource.resources ?? []) referencedFiles.add(file);
}

for (const file of referencedFiles) await assertBuiltFile(file);
await assertBuiltFile("catalog.json");

console.log(`${target} extension built to ${outdir}`);
