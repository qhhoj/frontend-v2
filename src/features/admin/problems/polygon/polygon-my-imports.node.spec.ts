import { describe, expect, it } from 'vitest';
import { importJob } from '@/test/admin-fixtures/polygon';
import { myImportStatusOf } from './polygon-my-imports';

const RESULT = { code: 'kminmax', problemId: 'p-1', summary: null, attention: null };

describe('myImportStatusOf', () => {
  it.each([
    ['waiting', 'queued'],
    ['delayed', 'queued'],
    ['prioritized', 'queued'],
    ['active', 'running'],
    ['failed', 'failed'],
  ])('reads the queue state %s as %s', (state, status) => {
    expect(myImportStatusOf(importJob({ state }))).toBe(status);
  });

  it('tells a clean import from one that landed but needs a repair', () => {
    expect(myImportStatusOf(importJob({ state: 'completed', result: RESULT }))).toBe('done');
    const attention = {
      code: 'imported_needs_attention' as const,
      message: 'data files',
      params: null,
    };
    expect(
      myImportStatusOf(importJob({ state: 'completed', result: { ...RESULT, attention } })),
    ).toBe('attention');
  });
});
