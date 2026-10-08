import { flushPromises } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';
import { announcement, contestDetail } from '@/test/fixtures';
import { contestPageRoutes } from '@/test/contest-routes';
import { FakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { mockApi, page, sequence } from '@/test/mock-api';
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

  it('opens no stream for an ended contest', async () => {
    mockApi({ ...anonymousViewer, ...contestPageRoutes(contestDetail({ phase: 'ended' })) });
    await mountApp('/contests/r42');
    expect(FakeEventSource.instances).toHaveLength(0);
  });
});
