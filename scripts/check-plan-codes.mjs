// Fails `npm run lint` when a source comment cites a review-plan code (P-04, Q-10 A, Cells A, E4, B21).
// Scans src/ and README.md. docs/decisions.md is exempt: it is a dated log and keeps its old lines.
// The codes live in notes outside this repo; say the reason, or point at the docs/decisions.md line.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const srcDir = new URL('../src/', import.meta.url).pathname;
const readme = new URL('../README.md', import.meta.url).pathname;
const PLAN_CODE = /\b(?:[PQ]-\d{2}|Cells [A-Z]|E4|B\d{2}|[Pp]lan (?:8f-2|F\d|VNOI F\d))\b/;
const isSource = (name) => /\.(?:ts|vue|css)$/.test(name);

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'generated' ? [] : sourceFiles(path);
    return isSource(entry.name) ? [path] : [];
  });

const offences = [...sourceFiles(srcDir), readme].flatMap((path) =>
  readFileSync(path, 'utf8')
    .split('\n')
    .flatMap((line, index) =>
      PLAN_CODE.test(line)
        ? [`${relative(srcDir, path).replace(/^\.\.\//, '')}:${index + 1}: ${line.trim()}`]
        : [],
    ),
);

if (offences.length) {
  console.error(
    `Plan codes in source (state the reason, or cite docs/decisions.md):\n${offences.join('\n')}`,
  );
  process.exit(1);
}
