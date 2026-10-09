import { describe, expect, it, vi } from 'vitest';
import type * as LineDiffModule from '@/lib/line-diff';
import { mountComponent } from '@/test/mount';
import SourceDiff from './SourceDiff.vue';

const spy = vi.hoisted(() => ({ calls: 0 }));
vi.mock('@/lib/line-diff', async (importOriginal) => {
  const actual = await importOriginal<typeof LineDiffModule>();
  return {
    ...actual,
    wordSegments: (...args: Parameters<typeof actual.wordSegments>) => {
      spy.calls += 1;
      return actual.wordSegments(...args);
    },
  };
});

const lines = (count: number) =>
  Array.from({ length: count }, (_unused, index) => `line ${index + 1}`).join('\n');

describe('SourceDiff word segments', () => {
  it('diffs each changed row once, however often the table renders', async () => {
    const { lineDiff } = await import('@/lib/line-diff');
    const rows = lineDiff(`${lines(10)}\nold`, `${lines(10)}\nnew`)!;
    const wrapper = mountComponent(SourceDiff, { props: { rows } });
    const afterMount = spy.calls;
    expect(afterMount).toBeGreaterThan(0);
    await wrapper.findAll('[data-testid="diff-fold"]')[0]!.trigger('click');
    expect(spy.calls).toBe(afterMount);
  });
});
