import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { ALLOWED, arbitraryUtilities } from './arbitrary-utilities.mjs';

const found = (line: string): string[] => arbitraryUtilities(line);

describe('arbitraryUtilities', () => {
  it.each([
    [`class="p-2 text-[13px] text-muted"`, ['text-[13px]']],
    [`'sm:text-[40px] font-bold'`, ['sm:text-[40px]']],
    [`class="text-[12.5px]"`, ['text-[12.5px]']],
    [`class="text-[0.8rem]"`, ['text-[0.8rem]']],
    [`'size-2 rounded-[3px]'`, ['rounded-[3px]']],
    [`class="rounded-t-[1.125rem]"`, ['rounded-t-[1.125rem]']],
    [`class="fixed z-[1200]"`, ['z-[1200]']],
    [`\`x \${y} !text-[11px]\``, ['!text-[11px]']],
    [`class="text-[13px]/5 z-[5]!"`, ['text-[13px]/5', 'z-[5]!']],
    [`'fixed inset-0 z-50'`, ['z-50']],
    [`class="size-4 accent-[var(--qh-accent)]"`, ['accent-[var(--qh-accent)]']],
    [`'min-h-[var(--qa-control,2.25rem)] flex'`, ['min-h-[var(--qa-control,2.25rem)]']],
  ])('flags %s', (line, expected) => {
    expect(found(line)).toEqual(expected);
  });

  it.each([
    `class="text-meta text-caption text-tiny text-sm text-title rounded-card rounded-control z-toast z-overlay accent-accent min-h-(--qa-control)"`,
    `class="text-[var(--x)] leading-[1.75] w-[13px] z-10"`,
    `// text-[13px] is gone`,
    ` * 'rounded-[3px]' in a doc comment`,
  ])('accepts %s', (line) => {
    expect(found(line)).toEqual([]);
  });
});

describe('ALLOWED', () => {
  it('lists only classes still present in their files', () => {
    for (const [file, classes] of Object.entries(ALLOWED as Record<string, string[]>)) {
      const used = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
        .split('\n')
        .flatMap((line) => found(line));
      for (const name of classes) expect(used, `${file}: ${name}`).toContain(name);
    }
  });
});
