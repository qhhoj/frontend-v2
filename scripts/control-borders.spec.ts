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

  it('flags a hairline and a field variant in separate literals of one element', () => {
    expect(
      found(`<label class="border border-line" :class="open ? 'focus-within:ring-2' : ''">`),
    ).toEqual(['1:border-line']);
    expect(
      found(
        `<div\n  :class="[err ? 'border-negative' : 'border-line-strong', 'placeholder:x']"\n>`,
      ),
    ).toEqual(['2:border-line-strong']);
    expect(found(`<input class="sm:border-line" />`)).toEqual(['1:sm:border-line']);
  });

  it.each([
    `<label class="border border-line group-focus-within:ring-2">`,
    `<label class="border border-line peer-placeholder:text-muted">`,
    `<label class="border border-line has-[input:checked]:border-accent">`,
    `<label class="border border-line has-[:focus]:ring-2">`,
    `<label class="border border-line [&:focus-within]:ring-2">`,
    `<label class="border border-line [&:has(input:checked)]:bg-accent">`,
    `<label class="border border-line md:group-has-checked:bg-accent">`,
  ])('flags an arbitrary or group-prefixed field variant: %s', (source) => {
    expect(found(source)).toEqual(['1:border-line']);
  });

  it.each([
    `<div class="border border-line hover:border-line-strong" :class="a ? 'x' : 'focus-visible:ring-2'">`,
    `<div class="border border-line [&:hover]:bg-surface group-hover:bg-surface">`,
    `<div class="border border-line"><p class="focus-within:ring-2">x</p></div>`,
  ])('accepts a hairline whose element has no field variant: %s', (source) => {
    expect(found(source)).toEqual([]);
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
