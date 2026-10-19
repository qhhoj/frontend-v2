// `src/api/generated/` is machine-written from the backend contract and skipped.
// Colours live only in src/theme/themes/*.css; everything else uses semantic tokens. Specs are skipped (contrast tests use literal colours).
// Stock radius/shadow class names are rejected too: `@theme` resets them, so they render nothing. So are the stock type sizes `text-lg` ... `text-9xl`,
// which skip the named scale (scripts/stock-utilities.mjs).
// The retired radius roles rounded-tile and rounded-panel are rejected as well (scripts/retired-utilities.mjs).
// So are arbitrary sizes, radii and z-indexes (`text-[13px]`, `rounded-[3px]`, `z-[5]`): use the named steps (scripts/arbitrary-utilities.mjs).
// The exemptions are Bit's sprite palettes (src/mascot/bit-sprite.ts) and the avatar's sprite data (src/mascot/avatar/avatar-sprites.ts):
// image-like data that Bit keeps in every theme.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { retiredUtilities } from './retired-utilities.mjs';
import { stockUtilities } from './stock-utilities.mjs';
import { ALLOWED, arbitraryUtilities } from './arbitrary-utilities.mjs';

const root = new URL('../src/', import.meta.url).pathname;
const themesDir = join(root, 'theme', 'themes');
const generatedDir = join(root, 'api', 'generated');
const spriteFiles = new Set([
  join(root, 'mascot', 'bit-sprite.ts'),
  join(root, 'mascot', 'avatar', 'avatar-sprites.ts'),
]);
const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === themesDir || path === generatedDir ? [] : files(path);
    return /\.(vue|ts|css)$/.test(entry.name) &&
      !entry.name.endsWith('.spec.ts') &&
      !spriteFiles.has(path)
      ? [path]
      : [];
  });

/** A finder that reads one line (and the file's path under src/) and answers the offending words. */
const perLine = (find) => (source, rel) =>
  source.split('\n').flatMap((text, index) => {
    const found = find(text, rel);
    return found.length ? [{ line: index + 1, text: found.join(' ') }] : [];
  });

/** Each check reads a whole file and answers `{ line, text }` offences; the first group that has any is reported. */
const CHECKS = [
  {
    message: `Arbitrary size/radius/z-index classes (use text-tiny|caption|meta|sm|base|title|subtitle|section|display|page|stat|hero, rounded-<role>, z-<layer>; docs/design-language.md):`,
    find: perLine((line, rel) =>
      arbitraryUtilities(line).filter((name) => !(ALLOWED[rel] ?? []).includes(name)),
    ),
  },
  {
    message: `Stock classes that skip the named scales: the theme resets rounded-lg and shadow-md (they render nothing), and text-lg...text-9xl bypass the type scale (use rounded-cell|row|card|pill|skeleton|control, shadow-glow|float, text-subtitle|section|display|page|stat|hero|score):`,
    find: perLine(stockUtilities),
  },
  {
    message: `Retired radius roles rounded-tile (20 px) and rounded-panel (28 px): use rounded-row for an inset tile, a notice or a menu, rounded-cell for code and fields, rounded-card for a card or a dialog (docs/design-language.md):`,
    find: perLine(retiredUtilities),
  },
  {
    message: `Colour literals outside src/theme/themes/ (use a --qh- token):`,
    find: perLine((line) => (colourLiteral.test(line) ? [line.trim()] : [])),
  },
];

const sources = files(root).map((path) => ({
  rel: relative(root, path),
  source: readFileSync(path, 'utf8'),
}));

for (const { message, find } of CHECKS) {
  const offences = sources.flatMap(({ rel, source }) =>
    find(source, rel).map(({ line, text }) => `src/${rel}:${line}: ${text}`),
  );
  if (offences.length) {
    console.error(`${message}\n${offences.join('\n')}`);
    process.exit(1);
  }
}
