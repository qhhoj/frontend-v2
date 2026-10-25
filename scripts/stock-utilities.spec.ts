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
    `class="font-display text-lg font-bold"`,
    `'md:text-2xl leading-tight'`,
    `\`\${size} text-9xl\``,
    `'text-xl/7'`,
    `class="text-xs text-muted"`,
  ])('flags a stock class in %s', (line) => {
    expect(found(line)).toHaveLength(1);
  });

  it('flags each stock size of a responsive pair', () => {
    expect(found(`'text-3xl md:text-5xl'`)).toEqual(['text-3xl', 'text-5xl']);
  });

  it.each([
    `class="rounded-cell rounded-row rounded-card rounded-pill rounded-skeleton"`,
    `class="rounded-t-card shadow-glow rounded-[2px]"`,
    `class="rounded-full rounded-none"`,
    `// rounded-lg is reset by the theme`,
    ` * 'rounded-lg' in a doc comment`,
    `const rounded = 1;`,
    `class="text-tiny text-caption text-meta text-sm text-base text-title"`,
    `class="text-subtitle text-section text-display text-page text-stat text-hero text-score"`,
    `class="text-muted text-content text-xlarge"`,
    `// text-lg is a stock step`,
  ])('accepts %s', (line) => {
    expect(found(line)).toEqual([]);
  });
});
