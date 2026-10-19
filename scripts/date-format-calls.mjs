// Dates and times are formatted in one place, src/lib/format-date.ts (docs/decisions.md, "One formatDate"): six hand-rolled formats had drifted apart.
// This bans the platform formatters everywhere else in src/: `toLocaleDateString`, `toLocaleString`, `toLocaleTimeString` and `Intl.DateTimeFormat`
// (called with or without `new`; the `Intl.DateTimeFormatOptions` type is fine). Specs are not scanned.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const BANNED = /\.toLocale(?:Date|Time)?String\s*\(|\bIntl\.DateTimeFormat\b/;
const COMMENT_LINE = /^\s*(?:\/\/|\/\*|\*|<!--)/;

/**
 * Files under src/ that may call a banned formatter, each with the reason. Add an entry only for a call that shows no date to a reader;
 * a displayed date goes through `formatDate`.
 */
export const ALLOWED = {
  'lib/format-date.ts': 'the formatDate module itself',
  'features/account/profile/time-zones.ts':
    "asks the platform for a zone's offset name (`shortOffset`) to label the zone picker; no date is shown",
};

/** Whether one source line calls a banned formatter; comment lines are ignored. */
export const callsDateFormatter = (line) => !COMMENT_LINE.test(line) && BANNED.test(line);

const sourceFiles = (dir) =>
  readdirSync(dir, { recursive: true })
    .filter((path) => /\.(vue|ts)$/.test(path) && !path.endsWith('.spec.ts'))
    .filter((path) => !path.startsWith('api/generated/'))
    .sort();

/** `src/<path>:<line>: <text>` for each banned call in `text`, the content of src/<path>; none for an allowed file. */
export function offencesIn(path, text) {
  if (path in ALLOWED) return [];
  return text
    .split('\n')
    .flatMap((line, index) =>
      callsDateFormatter(line) ? [`src/${path}:${index + 1}: ${line.trim()}`] : [],
    );
}

/** The offences of every source file under `root` (the src/ directory). */
export const dateFormatOffences = (root) =>
  sourceFiles(root).flatMap((path) => offencesIn(path, readFileSync(join(root, path), 'utf8')));
