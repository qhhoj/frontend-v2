// Fails `npm run lint` while a banned date formatter is called outside src/lib/format-date.ts (scripts/date-format-calls.mjs).
// Scans src/, or the directory given as the one argument (the spec runs it on a crafted tree).
import { dateFormatOffences } from './date-format-calls.mjs';

const root = process.argv[2] ?? new URL('../src/', import.meta.url).pathname;
const offences = dateFormatOffences(root);
if (offences.length) {
  console.error(
    `Date and time formatters outside src/lib/format-date.ts (use formatDate(date, 'short' | 'date' | 'datetime', locale) or formatClock; docs/decisions.md):\n${offences.join('\n')}`,
  );
  process.exit(1);
}
