import { afterEach, describe, expect, it, vi } from 'vitest';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const NOW = Date.parse('2026-10-08T09:37:07Z');
const run = (key: string, name: string) => ({
  contest: { key, name, startTime: '2026-10-08T08:00:00Z', endTime: '2999-01-01T00:00:00Z' },
  participation: participationSummary({ endTime: '2999-01-01T00:00:00Z' }),
});

describe('contest bar on contest pages (M-01)', () => {
  afterEach(() => vi.useRealTimers());

  it("keeps only the status and the clock on the running contest's own pages", async () => {
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
    await vi.waitFor(() => expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(true));
    const bar = wrapper.get('[data-testid="contest-bar"]');
    expect(bar.find('nav').exists()).toBe(false);
    expect(bar.find('[role="timer"]').exists()).toBe(true);
  });

  it("links back to the viewer's contest from another contest's page", async () => {
    vi.useFakeTimers({ now: NOW, toFake: ['Date'] });
    mockApi({
      ...signedInViewer(),
      ...contestPageRoutes(),
      'GET /contests/current': ok(run('trash_ended', 'Trash Cup 2026')),
      'GET /contests/trash_ended/announcements': page([]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    await vi.waitFor(() => expect(wrapper.find('[data-testid="contest-bar"]').exists()).toBe(true));
    const links = wrapper.get('[data-testid="contest-bar"] nav').findAll('a');
    expect(links.map((link) => link.attributes('href'))).toContain('/contests/trash_ended/ranking');
  });
});
