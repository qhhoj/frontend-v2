import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain .mjs module without types
import { ALLOWED, actionlessEmptyStates } from './empty-actions.mjs';

const lines = (source: string, rel = 'features/x/XPage.vue'): number[] =>
  (actionlessEmptyStates(source, rel) as { line: number }[]).map((found) => found.line);

describe('actionlessEmptyStates', () => {
  it('flags an empty state with no next step, self-closing or not', () => {
    expect(lines(`<div>\n  <EmptyState>Chưa có gì.</EmptyState>\n</div>`)).toEqual([2]);
    expect(lines(`<EmptyState compact />`)).toEqual([1]);
  });

  it('accepts one whose action slot is filled, in either slot syntax', () => {
    expect(
      lines(
        `<EmptyState :kind="k">\n  Trống.\n  <template #action><AppButton /></template>\n</EmptyState>`,
      ),
    ).toEqual([]);
    expect(lines(`<EmptyState><template v-slot:action>x</template></EmptyState>`)).toEqual([]);
  });

  it('judges each empty state of a file on its own', () => {
    const source = `<EmptyState>A<template #action>x</template></EmptyState>\n<EmptyState>B</EmptyState>`;
    expect(lines(source)).toEqual([2]);
  });

  it('leaves listed files and non-vue files alone', () => {
    const [rel] = Object.keys(ALLOWED);
    expect(lines(`<EmptyState>A</EmptyState>`, rel)).toEqual([]);
    expect(lines(`const html = '<EmptyState>A</EmptyState>';`, 'features/x/x.ts')).toEqual([]);
  });
});

describe('the list of files allowed an empty state without a next step', () => {
  it('names only files that still have one, so a fixed file must leave it', () => {
    const stale = Object.keys(ALLOWED as Record<string, string>).filter((rel) => {
      const path = `src/${rel}`;
      if (!existsSync(path)) return true;
      const source = readFileSync(path, 'utf8');
      // Checked under an unlisted path, so the list itself does not hide the offence.
      return actionlessEmptyStates(source, `unlisted/${rel}`).length === 0;
    });
    expect(stale).toEqual([]);
  });
});
