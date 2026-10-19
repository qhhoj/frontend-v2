import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = join(import.meta.dirname, 'check-date-format.mjs');
const BANNED_CALLS = [
  'const day = when.toLocaleDateString();',
  'const clock = when.toLocaleTimeString();',
  'const both = when.toLocaleString();',
  'const format = new Intl.DateTimeFormat(locale);',
  'const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;',
];

let root: string;
const write = (path: string, text: string) => {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text);
};
/** Runs `npm run lint:dates`' script on the crafted tree. */
const lint = () => spawnSync(process.execPath, [SCRIPT, root], { encoding: 'utf8' });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'check-date-format-'));
});
afterEach(() => rmSync(root, { recursive: true, force: true }));

describe('check-date-format', () => {
  it('passes a tree that formats through formatDate', () => {
    write('features/blog/PostCard.vue', `formatDate(post.publishOn, 'date', locale.locale)`);
    write(
      'lib/other.ts',
      `const options: Intl.DateTimeFormatOptions = {};\n// when.toLocaleString()`,
    );
    const result = lint();
    expect(result.status).toBe(0);
    expect(result.stderr).toBe('');
  });

  it.each(BANNED_CALLS)('fails on %s and names the file and the line', (call) => {
    write('features/blog/Bad.vue', `const ok = 1;\n${call}\n`);
    const result = lint();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain(`src/features/blog/Bad.vue:2: ${call}`);
  });

  it('flags a call whose arguments continue on the next lines', () => {
    write(
      'features/blog/Bad.vue',
      `when.toLocaleDateString(\n  'vi-VN',\n  { month: 'short' },\n);`,
    );
    const result = lint();
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('src/features/blog/Bad.vue:1:');
  });

  it('lists every offence of every file', () => {
    write('features/a/A.vue', 'a.toLocaleString();');
    write('features/b/B.ts', 'ok();\nb.toLocaleTimeString();');
    const { stderr } = lint();
    expect(stderr).toContain('src/features/a/A.vue:1:');
    expect(stderr).toContain('src/features/b/B.ts:2:');
  });

  it('leaves the formatDate module, the time-zone list, specs and generated code alone', () => {
    write('lib/format-date.ts', 'new Intl.DateTimeFormat();');
    write('features/account/profile/time-zones.ts', 'new Intl.DateTimeFormat();');
    write('features/blog/PostCard.spec.ts', 'when.toLocaleString();');
    write('api/generated/schema.d.ts', 'when.toLocaleString();');
    expect(lint().status).toBe(0);
  });
});
