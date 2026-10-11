import { afterEach, describe, expect, it, vi } from 'vitest';
import { pixelsOf, pixelsOfKind } from '@/test/bit-pixels';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

/** Longer than the query's first retry delay (1 s), so a retrying query would have asked again. */
const PAST_FIRST_RETRY_MS = 5_000;

describe('contest stats tab', () => {
  describe('when the statistics are not open yet', () => {
    afterEach(() => vi.useRealTimers());

    it('says so, with Bit and a way to the ranking, and does not retry', async () => {
      vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
      const calls = mockApi({
        ...anonymousViewer,
        ...contestPageRoutes(),
        'GET /contests/r42/stats': fail(403, 'forbidden'),
      });
      const { wrapper } = await mountApp('/contests/r42/stats');
      await vi.advanceTimersByTimeAsync(PAST_FIRST_RETRY_MS);
      expect(wrapper.get('main').text()).toContain('Thống kê chưa mở');
      const bit = wrapper.get('main [role="img"]');
      expect(pixelsOf(bit.element)).toBe(pixelsOfKind('security'));
      expect(wrapper.find('main a[href="/contests/r42/ranking"]').exists()).toBe(true);
      expect(calls.filter((call) => call.path === '/contests/r42/stats')).toHaveLength(1);
    });
  });
});
