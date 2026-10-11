import { describe, expect, it } from 'vitest';
import type { SubmissionListItem } from '@/api/types/submissions';
import { nextDelayIndex, pollableIds, progressKey, ROW_POLL_LIMIT_MS } from './in-flight-poll';

const summary = {
  unit: 'case' as const,
  statuses: ['AC' as const],
  batches: [null],
  more: 0,
  total: 5,
};
const row = (id: string, extra: Partial<SubmissionListItem> = {}) =>
  ({ id, status: 'G', testSummary: summary, ...extra }) as SubmissionListItem;

describe('which rows keep the list polling', () => {
  it('takes rows being judged with a strip, not finished or strip-less ones', () => {
    const rows = [
      row('a'),
      row('b', { status: 'D' }),
      row('c', { testSummary: null }),
      row('d', { status: 'QU' }),
    ];
    expect(pollableIds(rows, new Map(), 0)).toEqual(['a', 'd']);
  });

  it('drops a row two minutes after it was first seen in flight', () => {
    const firstSeen = new Map([['a', 0]]);
    expect(pollableIds([row('a')], firstSeen, ROW_POLL_LIMIT_MS - 1)).toEqual(['a']);
    expect(pollableIds([row('a')], firstSeen, ROW_POLL_LIMIT_MS)).toEqual([]);
  });
});

describe('polling back-off', () => {
  it('waits longer while nothing moves and starts over when something does', () => {
    expect([0, 1, 2].map((index) => nextDelayIndex(index, false))).toEqual([1, 2, 2]);
    expect(nextDelayIndex(2, true)).toBe(0);
  });

  it('sees a newly judged test as movement', () => {
    const before = progressKey([row('a')], ['a']);
    const after = progressKey(
      [row('a', { testSummary: { ...summary, statuses: ['AC', 'WA'], batches: [null, null] } })],
      ['a'],
    );
    expect(after).not.toBe(before);
  });
});
