import { describe, expect, it } from 'vitest';
import { comment } from '@/test/community-fixtures';
import { flattenInTimeOrder } from './comment-order';

describe('flattenInTimeOrder', () => {
  it('lists a page of threads (roots newest first, replies after their root) oldest first, numbered from 1', () => {
    const newRoot = comment({ id: 'c3', createdAt: '2026-10-10T09:00:00Z' });
    const oldRoot = comment({ id: 'c1', createdAt: '2026-10-09T09:00:00Z' });
    const lateReply = comment({ id: 'c4', parentId: 'c1', createdAt: '2026-10-10T10:00:00Z' });
    const earlyReply = comment({ id: 'c2', parentId: 'c1', createdAt: '2026-10-09T12:00:00Z' });
    const flat = flattenInTimeOrder([newRoot, oldRoot, earlyReply, lateReply]);
    expect(flat.map(({ comment: shown, number }) => [shown.id, number])).toEqual([
      ['c1', 1],
      ['c2', 2],
      ['c3', 3],
      ['c4', 4],
    ]);
  });

  it('breaks a tie of times by id and leaves the input untouched', () => {
    const input = [
      comment({ id: 'b', createdAt: '2026-10-10T09:00:00Z' }),
      comment({ id: 'a', createdAt: '2026-10-10T09:00:00Z' }),
    ];
    expect(flattenInTimeOrder(input).map(({ comment: shown }) => shown.id)).toEqual(['a', 'b']);
    expect(input.map((shown) => shown.id)).toEqual(['b', 'a']);
  });
});
