// Palette generator. `node scripts/palette/build.mjs` writes src/theme/palette/<id>.css for every palette in
// scripts/palette/palettes.mjs, and swatches.ts (what the Appearance page's picker shows); `--check` (npm run
// lint:palette, part of npm run lint) fails when a contrast pair is under its minimum or a committed file differs from
// what the inputs generate.
import { readdirSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { proveSet } from './checks.mjs';
import { paletteCss } from './css.mjs';
import { PALETTES } from './palettes.mjs';
import { solvePalette } from './solve.mjs';
import { swatchesTs } from './swatches.mjs';

const OUT_DIR = new URL('../../src/theme/palette/', import.meta.url);
const MODES = ['light', 'dark'];
const LEVELS = ['standard', 'high'];

const palettes = PALETTES.map((palette, index) => ({ ...palette, isDefault: index === 0 }));
const solved = palettes.map((palette) => ({
  palette,
  sets: Object.fromEntries(
    LEVELS.map((level) => [
      level,
      Object.fromEntries(MODES.map((mode) => [mode, solvePalette(palette, mode, level)])),
    ]),
  ),
}));
const failures = solved.flatMap(({ palette, sets }) =>
  LEVELS.flatMap((level) =>
    MODES.flatMap((mode) =>
      proveSet(sets[level][mode], mode, level).map((failure) => `${palette.id}: ${failure}`),
    ),
  ),
);

const files = {
  ...Object.fromEntries(
    solved.map(({ palette, sets }) => [`${palette.id}.css`, paletteCss(palette, sets)]),
  ),
  'swatches.ts': swatchesTs(solved),
};

async function formatted(name, text) {
  const filepath = fileURLToPath(new URL(name, OUT_DIR));
  return format(text, { ...(await resolveConfig(filepath)), filepath });
}

const readOrEmpty = (path) => {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return '';
  }
};

if (failures.length) {
  console.error(`Palette contrast failures:\n${failures.join('\n')}`);
  process.exit(1);
}
const checking = process.argv.includes('--check');
const stale = [];
for (const [name, text] of Object.entries(files)) {
  const path = new URL(name, OUT_DIR);
  const fresh = await formatted(name, text);
  if (!checking) writeFileSync(path, fresh);
  else if (readOrEmpty(path) !== fresh) stale.push(name);
}
// A file for a palette that no longer exists is stale too.
const generated = readdirSync(OUT_DIR).filter(
  (name) => /\.(css|ts)$/.test(name) && !(name in files),
);
for (const name of generated) {
  if (checking) stale.push(name);
  else unlinkSync(new URL(name, OUT_DIR));
}
if (stale.length) {
  console.error(
    `src/theme/palette/ is stale (${stale.join(', ')}): run \`npm run palette\` and commit.`,
  );
  process.exit(1);
}
for (const { palette } of solved)
  console.log(
    `palette ${palette.id}: ${MODES.length * LEVELS.length * Object.keys(palette.accents).length} colour sets proven`,
  );
