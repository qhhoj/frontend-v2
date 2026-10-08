import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestStats } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

/** Longer than the query's first retry delay (1 s), so a retrying query would have asked again. */
const PAST_FIRST_RETRY_MS = 5_000;

describe('contest stats tab', () => {
  it('shows the totals, each problem’s results in words and the languages', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'ended' })),
      'GET /contests/r42/stats': ok(contestStats()),
    });
    const { wrapper } = await mountApp('/contests/r42/stats');
    const tiles = wrapper.get('[data-testid="stats-tiles"]').text();
    expect(tiles).toContain('505');
    expect(tiles).toContain('81,6%');
    expect(tiles).toContain('318');
    const firstRow = wrapper.get('[data-testid="problem-results"] tbody tr');
    expect(firstRow.text()).toContain('AC 412');
    expect(firstRow.text()).toContain('81,6%');
    expect(wrapper.get('[data-testid="language-stats"]').text()).toContain('C++20');
    expect(wrapper.text()).toContain('ERR gồm MLE, OLE, IR, RTE, AB và IE');
  });

  it('fills each result segment in result order with its verdict colour', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'ended' })),
      'GET /contests/r42/stats': ok(contestStats()),
    });
    const { wrapper } = await mountApp('/contests/r42/stats');
    const firstBar = wrapper
      .get('[data-testid="problem-results"] tbody tr')
      .findAll('[aria-hidden="true"] > span');
    const fills = firstBar.map((segment) =>
      segment.classes().find((name) => name.startsWith('bg-verdict-')),
    );
    expect(fills).toEqual([
      'bg-verdict-ac',
      'bg-verdict-wa',
      'bg-verdict-ce',
      'bg-verdict-tle',
      'bg-verdict-rte',
    ]);
    expect(firstBar[0]!.attributes('style')).toContain('width: 81.58');
  });

  it('shows a dash for the accepted share while nothing was submitted', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail({ phase: 'ended' })),
      'GET /contests/r42/stats': ok(contestStats({ problems: [] })),
    });
    const { wrapper } = await mountApp('/contests/r42/stats');
    const [, acceptedTile] = wrapper.findAll('[data-testid="stats-tiles"] dd');
    expect(acceptedTile!.text()).toBe('—');
  });

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
      expect(wrapper.find('main [role="img"]').exists()).toBe(true);
      expect(wrapper.find('main a[href="/contests/r42/ranking"]').exists()).toBe(true);
      expect(calls.filter((call) => call.path === '/contests/r42/stats')).toHaveLength(1);
    });
  });
});
