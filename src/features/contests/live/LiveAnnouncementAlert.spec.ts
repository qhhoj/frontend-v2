import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { announcement, contestDetail, participationSummary } from '@/test/fixtures';
import { contestListRoutes, contestPageRoutes } from '@/test/contest-routes';
import { latestEventSource, pageStreams } from '@/test/fake-event-source';
import { mockApi, ok, page, sequence } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const FAR = '2999-01-01T00:00:00Z';
/** The viewer is inside r42, which runs until `endTime`. */
const inContest = (endTime = FAR): Record<string, MockHandler> => ({
  ...signedInViewer(),
  'GET /contests/current': ok({
    contest: { key: 'r42', name: 'Round 42', startTime: '2026-10-01T08:00:00Z', endTime },
    participation: participationSummary({ endTime: FAR }),
  }),
});
const alert = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.find('[data-testid="announcement-alert"]');
const openStreams = () => pageStreams().filter((source) => !source.closed);

describe('announcement alert of the contest the viewer is in', () => {
  beforeEach(() => localStorage.clear());

  it('streams the contest once from the shell and alerts a new announcement on any page', async () => {
    mockApi({
      ...inContest(),
      ...contestPageRoutes(contestDetail()),
      'GET /contests/r42/announcements': sequence(
        page([]),
        page([announcement(1, { title: 'Bài C: sửa giới hạn' })]),
      ),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(openStreams().map((source) => source.url)).toEqual([
      '/api/internal/events/contests/r42',
    ]);
    expect(alert(wrapper).exists()).toBe(false);
    latestEventSource().emit('announcement', {
      contestId: 'c',
      announcementId: announcement(1).id,
    });
    await flushPromises();
    expect(alert(wrapper).text()).toContain('Bài C: sửa giới hạn');
    expect(alert(wrapper).get('a').attributes('href')).toBe('/contests/r42/announcements');
    const region = wrapper.get('[data-testid="contest-announcement-live"]');
    expect([region.attributes('role'), region.attributes('aria-live')]).toEqual([
      'status',
      'polite',
    ]);
    expect(region.find('[data-testid="announcement-alert"]').exists()).toBe(true);
  });

  it('goes when closed and stays closed, while the tab still counts it unread', async () => {
    mockApi({
      ...inContest(),
      ...contestPageRoutes(contestDetail(), [announcement(2), announcement(1)]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(alert(wrapper).text()).toContain('Thông báo 2');
    await alert(wrapper)
      .findAll('button')
      .find((button) => button.text() === 'Đóng')!
      .trigger('click');
    expect(alert(wrapper).exists()).toBe(false);
    expect(wrapper.get('a[href="/contests/r42/announcements"]').text()).toContain('2 chưa đọc');
    wrapper.unmount();
    // The close is kept like the read mark: a reload does not bring the same announcement back.
    mockApi({
      ...inContest(),
      ...contestPageRoutes(contestDetail(), [announcement(2), announcement(1)]),
    });
    const reloaded = await mountApp('/contests/r42');
    expect(alert(reloaded.wrapper).exists()).toBe(false);
  });

  it('stays off the Announcements tab, which marks it read', async () => {
    mockApi({
      ...inContest(),
      ...contestPageRoutes(contestDetail(), [announcement(3)]),
    });
    const { wrapper, router } = await mountApp('/contests/r42/announcements');
    expect(alert(wrapper).exists()).toBe(false);
    await router.push('/contests/r42');
    await flushPromises();
    expect(alert(wrapper).exists()).toBe(false);
  });

  it('opens nothing once the contest itself has ended (a virtual run)', async () => {
    mockApi({
      ...inContest('2020-01-01T00:00:00Z'),
      ...contestListRoutes({}),
      // The contest bar still counts unread announcements; only the stream and the alert stop.
      'GET /contests/r42/announcements': page([announcement(1)]),
    });
    const { wrapper } = await mountApp('/contests');
    expect(openStreams()).toEqual([]);
    expect(alert(wrapper).exists()).toBe(false);
  });
});
