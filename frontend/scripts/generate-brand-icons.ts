import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DEFAULT_REPO_ROOT = path.resolve(import.meta.dir, "../..");
const EXTENSION_ICON_SIZES = [16, 32, 48, 128] as const;
const WEBSITE_ICON_SIZE = 512;
const TILE_COLOR = "#f3f0e7";

export type BrandIconOptions = {
  repoRoot?: string;
  sourcePath?: string;
};

export async function renderBrandIcon(sourcePath: string, size: number): Promise<Buffer> {
  const inset = Math.max(1, Math.round(size * 0.06));
  const tileSize = size - inset * 2;
  const radius = Math.max(2, Math.round(tileSize * 0.22));
  const markSize = Math.max(8, Math.round(tileSize * 0.64));

  const mark = await sharp(sourcePath)
    .trim({ background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .resize(markSize, markSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const tile = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${tileSize}" height="${tileSize}" viewBox="0 0 ${tileSize} ${tileSize}"><rect width="${tileSize}" height="${tileSize}" rx="${radius}" fill="${TILE_COLOR}"/></svg>`,
  );
  const markOffset = Math.round((size - markSize) / 2);

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      { input: tile, left: inset, top: inset },
      { input: mark, left: markOffset, top: markOffset },
    ])
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
    .toBuffer();
}

export async function generateBrandIcons(options: BrandIconOptions = {}): Promise<void> {
  const repoRoot = options.repoRoot ?? DEFAULT_REPO_ROOT;
  const sourcePath = options.sourcePath ?? path.join(repoRoot, "frontend/public/leet-progress-mark.png");
  const extensionIconDir = path.join(repoRoot, "extension/icons");
  const websitePublicDir = path.join(repoRoot, "frontend/public");
  const websiteAppDir = path.join(repoRoot, "frontend/app");

  await Promise.all([
    mkdir(extensionIconDir, { recursive: true }),
    mkdir(websitePublicDir, { recursive: true }),
    mkdir(websiteAppDir, { recursive: true }),
  ]);

  const websiteIcon = await renderBrandIcon(sourcePath, WEBSITE_ICON_SIZE);
  await Promise.all([
    writeFile(path.join(websitePublicDir, "leet-progress-icon.png"), websiteIcon),
    writeFile(path.join(websiteAppDir, "icon.png"), websiteIcon),
    ...EXTENSION_ICON_SIZES.map(async (size) => {
      const icon = await renderBrandIcon(sourcePath, size);
      await writeFile(path.join(extensionIconDir, `icon-${size}.png`), icon);
    }),
  ]);
}

if (import.meta.main) {
  await generateBrandIcons();
  console.log("Generated canonical Leet Progress website and extension icons.");
}
