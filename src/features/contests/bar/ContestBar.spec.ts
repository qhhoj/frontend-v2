import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { fail, mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const run = (key: string, name: string) => ({
  contest: { key, name, startTime: '2026-10-08T08:00:00Z', endTime: '2999-01-01T00:00:00Z' },
  participation: participationSummary({ endTime: '2999-01-01T00:00:00Z' }),
});

describe('contest bar on contest pages (M-01)', () => {
  afterEach(() => vi.useRealTimers());

  it("steps aside on the running contest's own tabs once their header shows the clock", async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const contest = contestDetail({
      viewer: contestViewer({ isCurrent: true, inContest: true, liveStatus: 'participating' }),
    });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contest),
      'GET /contests/current': ok(run(contest.key, contest.name)),
    });
    const { wrapper } = await mountApp(`/contests/${contest.key}`);
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="contest-clock"] [role="timer"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(false);
  });

  it('keeps its clock on a tab whose contest failed to load', async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    const contest = contestDetail();
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(contest),
      [`GET /contests/${contest.key}`]: fail(500, 'internal'),
      'GET /contests/current': ok(run(contest.key, contest.name)),
    });
    const { wrapper } = await mountApp(`/contests/${contest.key}/announcements`);
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="contest-bar"] [role="timer"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="contest-clock"]').exists()).toBe(false);
  });

  it("shows a chip in the top bar, not the bar, on another contest's page", async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/current': ok(run('trash_ended', 'Trash Cup 2026')),
      'GET /contests/trash_ended/announcements': page([]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="top-bar-live-contest"]').exists()).toBe(true),
    );
    expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(false);
  });
  it.each([
    [false, '#7'],
    [true, null],
  ])('chip shows the rank only on a live board (frozen: %s)', async (frozen, shown) => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/current': ok({
        ...run('trash_ended', 'Trash Cup 2026'),
        standing: { rank: 7, score: 100, cumtime: 0, frozen },
      }),
      'GET /contests/trash_ended/announcements': page([]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() =>
      expect(wrapper.find('[data-testid="top-bar-live-contest"]').exists()).toBe(true),
    );
    expect(wrapper.get('[data-testid="top-bar-live-contest"]').text().includes('#7')).toBe(
      shown !== null,
    );
  });
});
