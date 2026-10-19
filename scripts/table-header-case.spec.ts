import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { tableHeaderUppercase } from './table-header-case.mjs';

const lines = (source: string): number[] =>
  (tableHeaderUppercase(source) as { line: number }[]).map((found) => found.line);

describe('tableHeaderUppercase', () => {
  it('flags uppercase on a th, a thead and a tr', () => {
    expect(lines(`<th scope="col" class="px-3 text-caption uppercase">A</th>`)).toEqual([1]);
    expect(lines(`<thead class="uppercase"><tr><th>A</th></tr></thead>`)).toEqual([1]);
    expect(lines(`<table>\n<tr class="text-left tracking-wider uppercase">\n</tr>`)).toEqual([2]);
  });

  it('flags a header tag that spans lines and a class binding', () => {
    const source = `<th\n  scope="col"\n  :class="['px-2', wide && 'uppercase']"\n>`;
    expect(lines(source)).toEqual([3]);
  });

  it('flags a header recipe constant', () => {
    expect(lines(`const HEAD = 'px-2 py-2 text-xs uppercase';`)).toEqual([1]);
    expect(
      lines(`export const ENDED_HEAD_ROW_CLASS =\n  'text-left tracking-wider uppercase';`),
    ).toEqual([2]);
    expect(lines(`const HEADER_CELL_CLASSES: string = "uppercase";`)).toEqual([1]);
  });

  it('accepts the DataTable header recipe and a header tag with a `>` in a value', () => {
    expect(lines(`<th scope="col" class="px-3 text-meta font-semibold text-muted">A</th>`)).toEqual(
      [],
    );
    expect(lines(`<th @click="sort(x => x.a)" class="text-meta">A</th>`)).toEqual([]);
    expect(lines(`const HEAD = 'px-2 py-2 text-meta font-semibold text-muted';`)).toEqual([]);
  });

  it('leaves uppercase outside table headers alone', () => {
    expect(lines(`<p class="text-xs tracking-wide uppercase">Nhóm</p>`)).toEqual([]);
    expect(lines(`<td class="uppercase">x</td>`)).toEqual([]);
    expect(lines(`const GROUP = 'text-xs uppercase'; const AHEAD = 'uppercase';`)).toEqual([]);
  });
});
