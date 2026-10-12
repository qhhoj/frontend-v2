// `src/api/generated/` is machine-written from the backend contract and skipped.
// Colours live only in src/theme/themes/*.css; everything else uses semantic tokens. Specs are skipped (contrast tests use literal colours).
// Stock radius/shadow class names are rejected too: `@theme` resets them, so they render nothing (scripts/stock-utilities.mjs).
// So are arbitrary sizes, radii and z-indexes (`text-[13px]`, `rounded-[3px]`, `z-[5]`): use the named steps (scripts/arbitrary-utilities.mjs).
// The exemptions are Bit's sprite palettes (src/mascot/bit-sprite.ts) and the avatar's sprite data (src/mascot/avatar/avatar-sprites.ts):
// image-like data that Bit keeps in every theme.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
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

const offences = files(root).flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      colourLiteral.test(line) ? [`src/${relative(root, path)}:${index + 1}: ${line.trim()}`] : [],
    ),
);

const stockOffences = files(root).flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      stockUtilities(line).length
        ? [`src/${relative(root, path)}:${index + 1}: ${stockUtilities(line).join(' ')}`]
        : [],
    ),
);

const arbitraryOffences = files(root).flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .flatMap((line, index) => {
      const allowed = ALLOWED[relative(root, path)] ?? [];
      const found = arbitraryUtilities(line).filter((name) => !allowed.includes(name));
      return found.length ? [`src/${relative(root, path)}:${index + 1}: ${found.join(' ')}`] : [];
    }),
);

if (arbitraryOffences.length) {
  console.error(
    `Arbitrary size/radius/z-index classes (use text-tiny|caption|meta|sm|base|title|page|stat|hero, rounded-<role>, z-<layer>; docs/design-language.md):\n${arbitraryOffences.join('\n')}`,
  );
  process.exit(1);
}

if (stockOffences.length) {
  console.error(
    `Stock radius/shadow classes the theme resets (use rounded-cell|row|tile|card|panel|pill|skeleton or shadow-glow):\n${stockOffences.join('\n')}`,
  );
  process.exit(1);
}

if (offences.length) {
  console.error(
    `Colour literals outside src/theme/themes/ (use a --qh- token):\n${offences.join('\n')}`,
  );
  process.exit(1);
}
