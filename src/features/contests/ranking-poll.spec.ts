import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ranking, signedOut } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { RANKING_POLL_MS } from './contests.queries';

afterEach(() => vi.useRealTimers());
const rankingCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path === '/contests/r42/ranking').length;

describe('ranking poll', () => {
  it('re-reads a running board every 60 s, not 30 s, while low-power is on', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-10-08T10:00:00Z'));
    localStorage.setItem('qhhoj.lowPower', 'on');
    const calls = mockApi({
      'GET /auth/me': signedOut,
      ...contestPageRoutes(),
      'GET /contests/r42/ranking': ok(ranking()),
    });
    await mountApp('/contests/r42/ranking');
    await vi.waitFor(() =>
      expect(document.documentElement.hasAttribute('data-low-power')).toBe(true),
    );
    await vi.advanceTimersByTimeAsync(RANKING_POLL_MS + 1000);
    await flushPromises();
    expect(rankingCalls(calls)).toBe(1);
    await vi.advanceTimersByTimeAsync(RANKING_POLL_MS);
    await flushPromises();
    expect(rankingCalls(calls)).toBe(2);
  });
});
