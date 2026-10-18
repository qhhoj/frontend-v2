// Fails `npm run lint` while a banned date formatter is called outside src/lib/format-date.ts (scripts/date-format-calls.mjs).
import { dateFormatOffences } from './date-format-calls.mjs';

const offences = dateFormatOffences(new URL('../src/', import.meta.url).pathname);
if (offences.length) {
  console.error(
    `Date and time formatters outside src/lib/format-date.ts (use formatDate(date, 'short' | 'date' | 'datetime', locale) or formatClock; docs/decisions.md):\n${offences.join('\n')}`,
  );
  process.exit(1);
}
