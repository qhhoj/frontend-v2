// Palette generator. `node scripts/palette/build.mjs` writes src/theme/palette/*.css from scripts/palette/paper.mjs;
// `--check` (npm run lint:palette, part of npm run lint) fails when a contrast pair is under its minimum or a
// committed file differs from what the inputs generate.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';
import { proveSet } from './checks.mjs';
import { accentsCss, contrastCss, modeCss } from './css.mjs';
import { PAPER } from './paper.mjs';
import { solvePalette } from './solve.mjs';

const OUT_DIR = new URL('../../src/theme/palette/', import.meta.url);
const MODES = ['light', 'dark'];
const LEVELS = ['standard', 'high'];

const sets = Object.fromEntries(
  LEVELS.map((level) => [
    level,
    Object.fromEntries(MODES.map((mode) => [mode, solvePalette(PAPER, mode, level)])),
  ]),
);
const failures = LEVELS.flatMap((level) =>
  MODES.flatMap((mode) => proveSet(sets[level][mode], mode, level)),
);

const files = {
  'paper-light.css': modeCss(PAPER, 'light', sets.standard.light),
  'paper-dark.css': modeCss(PAPER, 'dark', sets.standard.dark),
  'contrast-high.css': contrastCss(PAPER, sets.high),
  'accents.css': accentsCss(PAPER, sets),
};

async function formatted(name, css) {
  const filepath = fileURLToPath(new URL(name, OUT_DIR));
  return format(css, { ...(await resolveConfig(filepath)), filepath });
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
const stale = [];
for (const [name, css] of Object.entries(files)) {
  const path = new URL(name, OUT_DIR);
  const fresh = await formatted(name, css);
  if (!process.argv.includes('--check')) writeFileSync(path, fresh);
  else if (readOrEmpty(path) !== fresh) stale.push(name);
}
if (stale.length) {
  console.error(
    `src/theme/palette/ is stale (${stale.join(', ')}): run \`npm run palette\` and commit.`,
  );
  process.exit(1);
}
console.log(
  `palette: ${MODES.length * LEVELS.length * Object.keys(PAPER.accents).length} colour sets proven`,
);
