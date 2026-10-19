import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { hairlineControlBorders } from './control-borders.mjs';

const found = (source: string): string[] =>
  (hairlineControlBorders(source) as { line: number; text: string }[]).map(
    (offence) => `${offence.line}:${offence.text}`,
  );

describe('hairlineControlBorders', () => {
  it.each([
    [`<input class="rounded-row border border-line bg-surface-strong" />`, ['1:border-line']],
    [`<select class="h-12 border border-line-strong">`, ['1:border-line-strong']],
    [`<textarea class="rounded-cell border border-line px-3" rows="3" />`, ['1:border-line']],
    [`<input type="checkbox" class="size-4 border border-line" />`, ['1:border-line']],
  ])('flags a hairline border on a control tag: %s', (source, expected) => {
    expect(found(source)).toEqual(expected);
  });

  it('flags a tag that spans lines, a class binding and a state ternary', () => {
    const source = `<select\n  v-model="x"\n  class="h-12 border"\n  :class="error ? 'border-negative' : 'border-line-strong'"\n>`;
    expect(found(source)).toEqual(['4:border-line-strong']);
  });

  it('flags a string that styles a field or a wrapper around one', () => {
    expect(found(`const A = 'rounded-row border border-line placeholder:text-muted';`)).toEqual([
      '1:border-line',
    ]);
    expect(found(`<label class="flex border border-line-strong focus-within:ring-2">`)).toEqual([
      '1:border-line-strong',
    ]);
    expect(found(`class: 'border border-line has-[:focus-visible]:outline-2',`)).toEqual([
      '1:border-line',
    ]);
    expect(found(`<label class="border border-line has-[:checked]:border-accent">`)).toEqual([
      '1:border-line',
    ]);
    expect(found(`<label class="border border-line has-checked:border-accent">`)).toEqual([
      '1:border-line',
    ]);
    expect(found(`<label class="border border-line has-focus-visible:outline-2">`)).toEqual([
      '1:border-line',
    ]);
    expect(found(`<label class="border border-line md:focus-within:ring-2">`)).toEqual([
      '1:border-line',
    ]);
  });

  it.each([
    `<input class="rounded-row border border-line-control bg-surface-strong" />`,
    `<select class="border border-line-control" :class="error ? 'border-negative' : ''">`,
    `<input class="border border-line-control placeholder:text-muted" />`,
    `<input class="h-10 disabled:border-line hover:border-line-strong" />`,
    `<div class="rounded-card border border-line bg-surface p-4"><p class="border-t border-line-strong">x</p></div>`,
    `<table><tr class="border-t border-line"><td>x</td></tr></table>`,
    `const CARD = 'rounded-row border border-line bg-surface';`,
  ])('accepts %s', (source) => {
    expect(found(source)).toEqual([]);
  });
});
