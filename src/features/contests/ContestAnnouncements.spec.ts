import { flushPromises } from '@vue/test-utils';
import { nextTick } from 'vue';
import { beforeEach, describe, expect, it } from 'vitest';
import { announcement, contestDetail, contestStats, problemMeta } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { FakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { anonymousViewer } from '@/test/problem-routes';

const tabLink = (wrapper: Awaited<ReturnType<typeof mountApp>>['wrapper']) =>
  wrapper.get('nav[aria-label="Mục kỳ thi"] a[href="/contests/r42/announcements"]');
const announcementCalls = (calls: ReturnType<typeof mockApi>) =>
  calls.filter((call) => call.path === '/contests/r42/announcements');

describe('contest announcements', () => {
  beforeEach(() => localStorage.clear());

  it('counts unread announcements on the tab, from the newest id this browser has seen', async () => {
    localStorage.setItem('qhhoj.contest-announcements-seen.r42', announcement(1).id);
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail(), [announcement(3), announcement(2), announcement(1)]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(tabLink(wrapper).text()).toMatch(/Thông báo\s*2/);
    expect(tabLink(wrapper).text()).toContain('2 chưa đọc');
  });

  it('follows the contest stream: a new announcement is fetched, announced once and counted', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /contests/r42/announcements': sequence(
        page([]),
        page([announcement(1, { title: 'Làm rõ đề bài C' })]),
      ),
    });
    const { wrapper } = await mountApp('/contests/r42');
    expect(latestEventSource().url).toBe('/api/internal/events/contests/r42');
    latestEventSource().emit('announcement', {
      contestId: 'c',
      announcementId: announcement(1).id,
    });
    await flushPromises();
    expect(announcementCalls(calls)).toHaveLength(2);
    expect(wrapper.get('[data-testid="announcement-live"]').text()).toBe(
      'Thông báo mới: Làm rõ đề bài C',
    );
    expect(tabLink(wrapper).text()).toContain('1 chưa đọc');
    expect(wrapper.get('aside').text()).toContain('Làm rõ đề bài C');
  });

  it('refetches without announcing after a resync, and closes the stream when the page goes', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail(), [announcement(1)]),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const stream = latestEventSource();
    stream.emit('resync', {});
    await flushPromises();
    expect(announcementCalls(calls)).toHaveLength(2);
    expect(wrapper.get('[data-testid="announcement-live"]').text()).toBe('');
    wrapper.unmount();
    expect(stream.closed).toBe(true);
  });

  it('lists every announcement on its tab, marks the new ones and then counts them as read', async () => {
    localStorage.setItem('qhhoj.contest-announcements-seen.r42', announcement(1).id);
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail(), [announcement(2), announcement(1)]),
    });
    const { wrapper } = await mountApp('/contests/r42/announcements');
    const items = wrapper.findAll('[data-testid="announcement"]');
    expect(items.map((item) => item.find('[data-testid="unread-pill"]').exists())).toEqual([
      true,
      false,
    ]);
    expect(items[0]!.find('.user-content').html()).toContain('Nội dung 2');
    expect(tabLink(wrapper).text()).not.toContain('chưa đọc');
  });

  it('puts Bit in an empty announcement list', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42/announcements');
    expect(wrapper.get('main').text()).toContain('Chưa có thông báo nào.');
    expect(wrapper.find('main [data-testid="inline-bit"]').exists()).toBe(true);
  });

  it('says the live updates paused when the browser gives up, and reconnects with a refetch', async () => {
    const calls = mockApi({ ...anonymousViewer, ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    latestEventSource().fail();
    await flushPromises();
    expect(wrapper.get('[data-testid="announcements-paused"]').text()).toContain(
      'Cập nhật trực tiếp tạm dừng.',
    );
    await wrapper.get('[data-testid="announcements-paused"] button').trigger('click');
    await flushPromises();
    expect(FakeEventSource.instances).toHaveLength(2);
    expect(latestEventSource().closed).toBe(false);
    expect(wrapper.find('[data-testid="announcements-paused"]').exists()).toBe(false);
    expect(announcementCalls(calls)).toHaveLength(2);
  });

  it.each(['stats', 'submissions'])(
    'keeps the live stream and its paused notice on the %s tab of a running contest',
    async (tab) => {
      mockApi({
        ...anonymousViewer,
        ...contestPageRoutes(),
        'GET /contests/r42/stats': ok(contestStats()),
        'GET /contests/r42/submissions': page([]),
        'GET /problems/meta': ok(problemMeta()),
      });
      const { wrapper } = await mountApp(`/contests/r42/${tab}`);
      expect(FakeEventSource.instances).toHaveLength(1);
      latestEventSource().fail();
      await flushPromises();
      expect(wrapper.get('[data-testid="announcements-paused"]').text()).toContain(
        'Cập nhật trực tiếp tạm dừng.',
      );
    },
  );

  it('opens no stream for an ended contest', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail({ phase: 'ended' })) });
    await mountApp('/contests/r42');
    expect(FakeEventSource.instances).toHaveLength(0);
  });

  it('reads a second announcement with the same title again', async () => {
    const first = announcement(1, { title: 'Đính chính' });
    const second = announcement(2, { title: 'Đính chính' });
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /contests/r42/announcements': sequence(page([]), page([first]), page([second, first])),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const liveText = () => wrapper.get('[data-testid="announcement-live"]').text();
    latestEventSource().emit('announcement', { contestId: 'c', announcementId: first.id });
    await flushPromises();
    expect(liveText()).toBe('Thông báo mới: Đính chính');
    latestEventSource().emit('announcement', { contestId: 'c', announcementId: second.id });
    await nextTick();
    expect(liveText()).toBe('');
    await flushPromises();
    expect(liveText()).toBe('Thông báo mới: Đính chính');
  });

  it('says a repeated frame for one announcement nothing new', async () => {
    const first = announcement(1, { title: 'Đính chính' });
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /contests/r42/announcements': sequence(page([]), page([first])),
    });
    const { wrapper } = await mountApp('/contests/r42');
    const liveText = () => wrapper.get('[data-testid="announcement-live"]').text();
    latestEventSource().emit('announcement', { contestId: 'c', announcementId: first.id });
    await flushPromises();
    latestEventSource().emit('announcement', { contestId: 'c', announcementId: first.id });
    await nextTick();
    expect(liveText()).toBe('Thông báo mới: Đính chính');
    await flushPromises();
    expect(liveText()).toBe('Thông báo mới: Đính chính');
  });

  it('hides the Trực tiếp badge in the rail while the stream is down', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes() });
    const { wrapper } = await mountApp('/contests/r42');
    expect(wrapper.get('aside').text()).toContain('Trực tiếp');
    latestEventSource().fail();
    await flushPromises();
    expect(wrapper.get('aside').text()).not.toContain('Trực tiếp');
  });

  it('closes the stream when the contest turns ended while the page stays open', async () => {
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(),
      'GET /contests/r42': sequence(ok(contestDetail()), ok(contestDetail({ phase: 'ended' }))),
    });
    const { queryClient } = await mountApp('/contests/r42/announcements');
    const stream = latestEventSource();
    expect(stream.closed).toBe(false);
    await queryClient.invalidateQueries({ queryKey: ['contests', 'detail'] });
    await flushPromises();
    expect(stream.closed).toBe(true);
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('shows the announcements of the contest now open, with its own marks, when the key changes', async () => {
    localStorage.setItem('qhhoj.contest-announcements-seen.r43', announcement(4).id);
    mockApi({
      ...anonymousViewer,
      ...contestPageRoutes(contestDetail(), [announcement(2), announcement(1)]),
      ...contestPageRoutes(contestDetail({ key: 'r43' }), [announcement(5), announcement(4)]),
    });
    const { wrapper, router } = await mountApp('/contests/r42/announcements');
    await router.push('/contests/r43/announcements');
    await flushPromises();
    const items = wrapper.findAll('[data-testid="announcement"]');
    expect(items.map((item) => item.find('[data-testid="unread-pill"]').exists())).toEqual([
      true,
      false,
    ]);
  });
});
