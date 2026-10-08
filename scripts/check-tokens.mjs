// Colours live only in src/theme/themes/*.css; everything else uses semantic tokens. Specs are skipped (contrast tests use literal colours).
// The one exemption is Bit's sprite palettes (src/mascot/bit-sprite.ts): image-like data that Bit keeps in every theme.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;
const themesDir = join(root, 'theme', 'themes');
const spriteFile = join(root, 'mascot', 'bit-sprite.ts');
const colourLiteral = /#[0-9a-fA-F]{3,8}\b|\b(?:rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/;

const files = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return path === themesDir ? [] : files(path);
    return /\.(vue|ts|css)$/.test(entry.name) &&
      !entry.name.endsWith('.spec.ts') &&
      path !== spriteFile
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

if (offences.length) {
  console.error(
    `Colour literals outside src/theme/themes/ (use a --qh- token):\n${offences.join('\n')}`,
  );
  process.exit(1);
}
