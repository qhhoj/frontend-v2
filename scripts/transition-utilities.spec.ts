import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { ALLOWED, bareTransitions } from './transition-utilities.mjs';

const found = (line: string): string[] => bareTransitions(line);

describe('bareTransitions', () => {
  it.each([
    [`class="cursor-pointer transition hover:ring-2"`, ['transition']],
    [`'transition-all duration-200'`, ['transition-all']],
    [`class="size-4 transition-transform group-open:rotate-90"`, ['transition-transform']],
    [`'md:transition' 'hover:transition-all'`, ['transition', 'transition-all']],
    [`:class="open ? 'transition-transform' : ''"`, ['transition-transform']],
  ])('flags %s', (line, expected) => {
    expect(found(line)).toEqual(expected);
  });

  it.each([
    `class="transition-colors duration-150"`,
    `class="transition-opacity transition-shadow"`,
    `enter-active-class="transition-[transform,opacity] duration-(--qh-duration)"`,
    `class="motion-reduce:transition-none transition-none"`,
    `// transition-all is banned`,
    ` * 'transition' in a doc comment`,
  ])('accepts %s', (line) => {
    expect(found(line)).toEqual([]);
  });
});

describe('ALLOWED', () => {
  it('names a reason and only classes still present in their files', () => {
    for (const [file, classes] of Object.entries(
      ALLOWED as Record<string, Record<string, string>>,
    )) {
      const used = readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8')
        .split('\n')
        .flatMap((line) => found(line));
      for (const [name, reason] of Object.entries(classes)) {
        expect(reason.length, `${file}: ${name} needs a reason`).toBeGreaterThan(10);
        expect(used, `${file}: ${name}`).toContain(name);
      }
    }
  });
});
