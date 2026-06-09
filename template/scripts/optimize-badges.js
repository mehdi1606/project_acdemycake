/**
 * optimize-badges.js
 *
 * Badge source images are ~13125×9188 px (≈120 MP, 4–10 MB each) — absurd for a
 * graphic that renders at 24–168 px. This script downscales each badge into three
 * responsive WebP sizes (all well under 50 KB) so the onboarding modal and every
 * avatar load instantly.
 *
 * Output (per badge N = 1..9), written next to the sources:
 *   badge-N-128.webp   (128 px wide  → tiny avatars / preview strip)
 *   badge-N.webp       (256 px wide  → default; overwrites the giant original)
 *   badge-N-512.webp   (512 px wide  → high-DPI showcase slides)
 *
 * Run once: `node scripts/optimize-badges.js`
 * (sharp is installed ad-hoc with `npm i --no-save sharp`.)
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, '..', 'public', 'assets', 'img', 'badge');
const SIZES = [
  { suffix: '-128', width: 128, quality: 82 },
  { suffix: '',     width: 256, quality: 82 },  // default filename
  { suffix: '-512', width: 512, quality: 80 },
];

(async () => {
  for (let i = 1; i <= 9; i++) {
    const src = path.join(DIR, `badge-${i}.webp`);
    if (!fs.existsSync(src)) { console.warn('missing', src); continue; }

    // Read the original ONCE into a buffer (the source file is also the 256 target).
    const input = await sharp(src).toBuffer();

    for (const { suffix, width, quality } of SIZES) {
      const out = path.join(DIR, `badge-${i}${suffix}.webp`);
      await sharp(input)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality, effort: 6, alphaQuality: 90 })
        .toFile(out + '.tmp');
      fs.renameSync(out + '.tmp', out);
      const kb = (fs.statSync(out).size / 1024).toFixed(1);
      console.log(`badge-${i}${suffix}.webp  →  ${width}px  ${kb} KB`);
    }
  }
  console.log('\nDone. All badge variants generated.');
})().catch((e) => { console.error(e); process.exit(1); });
