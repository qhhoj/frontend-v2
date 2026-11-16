// The app sources the lint scripts read (scripts/check-tokens.mjs, scripts/raw-elements.mjs): .vue, .ts and .css under
// src/, without specs, the machine-written `src/api/generated/`, the theme files (the one home of colour literals) and
// Bit's sprite data (image-like palettes Bit keeps in every theme).
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../src/', import.meta.url).pathname;
const themesDir = join(root, 'theme', 'themes');
const generatedDir = join(root, 'api', 'generated');
const spriteFiles = new Set([
  join(root, 'mascot', 'bit-sprite.ts'),
  join(root, 'mascot', 'avatar', 'avatar-sprites.ts'),
]);

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

/** Every checked source as `{ rel, source }`, `rel` being its path under src/. */
export const sourceTree = () =>
  files(root).map((path) => ({ rel: relative(root, path), source: readFileSync(path, 'utf8') }));
