import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { ALLOWED, callsDateFormatter, offencesIn } from './date-format-calls.mjs';

const flagged = (line: string): boolean => callsDateFormatter(line);

describe('callsDateFormatter', () => {
  it.each([
    `const day = new Date(value).toLocaleDateString('vi-VN');`,
    `return date.toLocaleString();`,
    `{{ when.toLocaleTimeString('vi-VN', { hour: '2-digit' }) }}`,
    `const format = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium' });`,
    `const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;`,
    `  new Intl.DateTimeFormat(locale, options).format(date)`,
  ])('flags %s', (line) => {
    expect(flagged(line)).toBe(true);
  });

  it.each([
    `formatDate(post.publishOn, 'date', locale.locale)`,
    `const name = word.toLocaleUpperCase();`,
    `new Intl.NumberFormat('vi-VN').format(value)`,
    `new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' })`,
    `const options: Intl.DateTimeFormatOptions = {};`,
    `type Part = Intl.DateTimeFormatPartTypes;`,
    `// toLocaleDateString is banned here`,
    ` * new Intl.DateTimeFormat in a doc comment`,
  ])('accepts %s', (line) => {
    expect(flagged(line)).toBe(false);
  });
});

describe('offencesIn', () => {
  const source = [
    'const day = ok();',
    'const bad = when.toLocaleDateString();',
    '// when.toLocaleString()',
  ];

  it('names the file, the line and the text of each banned call', () => {
    expect(offencesIn('features/blog/PostCard.vue', source.join('\n'))).toEqual([
      'src/features/blog/PostCard.vue:2: const bad = when.toLocaleDateString();',
    ]);
  });

  it('finds nothing in a file that formats through formatDate', () => {
    expect(
      offencesIn('features/blog/PostCard.vue', `formatDate(post.publishOn, 'date', locale)`),
    ).toEqual([]);
  });

  it('skips an allowed file and the formatDate module', () => {
    expect(offencesIn('lib/format-date.ts', source.join('\n'))).toEqual([]);
    expect(offencesIn('features/account/profile/time-zones.ts', source.join('\n'))).toEqual([]);
  });
});

describe('the allow-list of date formatter callers', () => {
  const src = join(import.meta.dirname, '..', 'src');
  it('names only files that exist and still call a banned formatter, so a cleaned file must leave it', () => {
    const stale = Object.keys(ALLOWED as Record<string, string>).filter(
      (path) =>
        !existsSync(join(src, path)) ||
        !readFileSync(join(src, path), 'utf8').split('\n').some(flagged),
    );
    expect(stale).toEqual([]);
  });

  it('gives every entry a reason', () => {
    const unexplained = Object.entries(ALLOWED as Record<string, string>).filter(
      ([, reason]) => reason.trim().length < 10,
    );
    expect(unexplained).toEqual([]);
  });
});
