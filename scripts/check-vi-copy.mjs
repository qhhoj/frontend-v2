// Fails when a Vietnamese message breaks the copy convention in scripts/vi-copy.mjs.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { viCopyOffences } from './vi-copy.mjs';

const i18nDir = new URL('../src/i18n/', import.meta.url).pathname;
const isViFile = (name) => name === 'vi.json' || name.endsWith('.vi.json');

const viFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return viFiles(path);
    return isViFile(entry.name) ? [path] : [];
  });

const offences = viFiles(i18nDir).flatMap((path) =>
  viCopyOffences(JSON.parse(readFileSync(path, 'utf8'))).map(
    (offence) => `src/i18n/${relative(i18nDir, path)}: ${offence}`,
  ),
);

if (offences.length) {
  console.error(`Vietnamese copy convention (docs/decisions.md):\n${offences.join('\n')}`);
  process.exit(1);
}
