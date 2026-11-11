// Makes the web copies of the Stygian assets the site uses (public/stygian/) from their originals.
//
//   node dev/stygian-assets.mjs <folder with the originals>
//
// The folder holds the originals under their asset names (e.g. bg_01_forgotten_library_main.jpg),
// at any depth, so the owner's asset pack (assets/backgrounds/...) works as it is. Each listed asset
// gets WebP and AVIF copies at the widths below (never wider than its original), named
// <asset>-<width>.webp / .avif. The originals are not copied into the site. See docs/stygian/ASSETS.md.
import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

/** The assets the site uses, and the widths it serves them at. */
const USED = {
  // The Dashboard's atmosphere: phones use the narrow copy, wider screens the wide one.
  bg_01_forgotten_library_main: { widths: [768, 1536, 2400] },
};
const OUT = fileURLToPath(new URL("../public/stygian/", import.meta.url));

const src = process.argv[2];
if (!src) {
  console.error("Usage: node dev/stygian-assets.mjs <folder with the originals>");
  process.exit(1);
}

/** Every file below a folder, by its name without the extension. */
function index(dir, found = new Map()) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) index(path, found);
    else if (/\.(jpe?g|png|webp)$/i.test(name)) found.set(basename(name, extname(name)), path);
  }
  return found;
}

const files = index(src);
mkdirSync(OUT, { recursive: true });
let missing = 0;
for (const [asset, { widths }] of Object.entries(USED)) {
  const file = files.get(asset);
  if (!file) {
    console.error(`MISSING ${asset} (not found under ${src})`);
    missing++;
    continue;
  }
  const { width: full } = await sharp(file).metadata();
  // Each requested width that is narrower than the original, then the original's own width (capped).
  const sizes = [...new Set([...widths.filter((w) => w < full), Math.min(full, Math.max(...widths))])].sort((a, b) => a - b);
  for (const w of sizes) {
    const base = sharp(file).resize({ width: w, withoutEnlargement: true });
    const webp = await base.clone().webp({ quality: 62, effort: 6 }).toFile(join(OUT, `${asset}-${w}.webp`));
    const avif = await base.clone().avif({ quality: 50, effort: 6 }).toFile(join(OUT, `${asset}-${w}.avif`));
    console.log(`${asset}-${w}: ${webp.width}x${webp.height}  webp ${Math.round(webp.size / 1024)} KB  avif ${Math.round(avif.size / 1024)} KB`);
  }
}
process.exit(missing ? 1 : 0);
