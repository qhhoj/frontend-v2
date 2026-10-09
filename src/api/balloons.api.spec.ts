import { describe, expect, it } from 'vitest';
import { balloon } from '@/test/contest-extras-fixtures';
import { mockApi, noContent, page } from '@/test/mock-api';
import { deliverBalloon, fetchBalloons, undeliverBalloon } from './balloons.api';

describe('balloon calls', () => {
  it('asks one state and page, and reads the two queue counts from the page meta', async () => {
    const calls = mockApi({
      'GET /contests/r42/balloons': page([balloon(0)], {
        total: 7,
        pendingTotal: 7,
        deliveredTotal: 3,
      }),
    });
    const result = await fetchBalloons('r42', { state: 'pending', page: 2, pageSize: 50 });
    const [call] = calls.filter((seen) => seen.path === '/contests/r42/balloons');
    expect(Object.fromEntries(call!.query)).toEqual({
      state: 'pending',
      page: '2',
      pageSize: '50',
    });
    expect(result.total).toBe(7);
    expect(result.counts).toEqual({ pendingTotal: 7, deliveredTotal: 3 });
  });

  it('reads hidden counts (a frozen volunteer read) and a missing count as null', async () => {
    mockApi({
      'GET /contests/r42/balloons': page([], { pendingTotal: null }),
    });
    const result = await fetchBalloons('r42', { state: 'all', page: 1, pageSize: 50 });
    expect(result.counts).toEqual({ pendingTotal: null, deliveredTotal: null });
  });

  it('delivers and undelivers one team-problem pair by id', async () => {
    const item = balloon(0);
    const base = `/contests/r42/balloons/${item.participationId}/${item.problemId}`;
    const calls = mockApi({
      [`POST ${base}/deliver`]: noContent(),
      [`POST ${base}/undeliver`]: noContent(),
    });
    await deliverBalloon('r42', item);
    await undeliverBalloon('r42', item);
    expect(calls.map((call) => call.path)).toEqual([`${base}/deliver`, `${base}/undeliver`]);
  });
});
