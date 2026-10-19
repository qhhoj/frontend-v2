import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { ALLOWED, rawHeadings } from './page-headings.mjs';

const lines = (source: string, rel = 'features/x/XPage.vue'): number[] =>
  (rawHeadings(source, rel) as { line: number }[]).map((found) => found.line);

describe('rawHeadings', () => {
  it('flags an h1 written in a page', () => {
    expect(lines(`<template>\n  <h1 class="page-title">A</h1>\n</template>`)).toEqual([2]);
    expect(lines(`<h1>A</h1>`)).toEqual([1]);
  });

  it('flags an h1 that spans lines or carries a binding with a ">"', () => {
    expect(lines(`<div>\n<h1\n  :class="a > b ? 'x' : 'y'"\n>A</h1>`)).toEqual([2]);
  });

  it('accepts PageHeader itself and any non-vue file', () => {
    expect(
      lines(`<h1 class="page-title">{{ title }}</h1>`, 'components/ui/PageHeader.vue'),
    ).toEqual([]);
    expect(lines(`const html = '<h1>A</h1>';`, 'features/x/x.ts')).toEqual([]);
  });

  it('leaves h2, h3 and a PageHeader element alone', () => {
    expect(lines(`<h2 class="section-title">A</h2><h3>B</h3><PageHeader title="A" />`)).toEqual([]);
  });

  it('accepts a listed page that keeps the page step and flags one that does not', () => {
    const [rel] = Object.keys(ALLOWED);
    expect(lines(`<h1 class="mt-2 page-title">A</h1>`, rel)).toEqual([]);
    expect(lines(`<h1 class="font-display text-section">A</h1>`, rel)).toEqual([1]);
  });

  it('gives every listed page a reason', () => {
    for (const reason of Object.values(ALLOWED))
      expect((reason as string).length).toBeGreaterThan(10);
  });
});
