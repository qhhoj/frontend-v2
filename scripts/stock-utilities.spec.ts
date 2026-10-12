import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { stockUtilities } from './stock-utilities.mjs';

const found = (line: string): string[] => stockUtilities(line);

describe('stockUtilities', () => {
  it.each([
    `class="rounded-lg border"`,
    `'min-h-11 rounded-xl p-4'`,
    `class="p-1 shadow-lg"`,
    `'rounded'`,
    `'rounded-t-lg'`,
    `'hover:rounded-sm'`,
    `\`x \${y} rounded-xs\``,
    `class="shadow"`,
  ])('flags a stock class in %s', (line) => {
    expect(found(line)).toHaveLength(1);
  });

  it.each([
    `class="rounded-cell rounded-row rounded-card rounded-pill rounded-skeleton"`,
    `class="rounded-t-card shadow-glow rounded-[2px]"`,
    `class="rounded-full rounded-none"`,
    `// rounded-lg is reset by the theme`,
    ` * 'rounded-lg' in a doc comment`,
    `const rounded = 1;`,
  ])('accepts %s', (line) => {
    expect(found(line)).toEqual([]);
  });
});
