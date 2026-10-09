import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionStore } from '@/stores/session.store';
import { FakeEventSource, userStream } from '@/test/fake-event-source';
import { sessionUser } from '@/test/fixtures';
import { fail, mockApi, noContent, ok, page, sequence } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { inboxSample, NOTIFICATION_NOW, notificationItem } from '@/test/notification-fixtures';
import { anonymousViewer, signedInViewer } from '@/test/problem-routes';
import { notificationsKey } from './notifications.queries';
import { useViewerId } from '@/stores/use-viewer-id';

const START = '/blog/new';
const routesWith = (extra: Record<string, MockHandler> = {}) => ({
  ...signedInViewer(),
  'GET /notifications/unread-count': ok({ count: 3 }),
  'GET /notifications': page(inboxSample(), { pageSize: 20 }),
  ...extra,
});
const bell = (wrapper: VueWrapper) => wrapper.get('[data-testid="notification-bell"]');
const drawer = () => document.body.querySelector<HTMLElement>('[role="dialog"]');
const drawerRows = () => [
  ...document.body.querySelectorAll<HTMLElement>(
    '[role="dialog"] [data-testid="notification-row"]',
  ),
];
async function openDrawer(wrapper: VueWrapper) {
  await bell(wrapper).trigger('click');
  await flushPromises();
}
/** The drawer's and the page's list reads; the high-priority banner's read (Task 5) is left out. */
const listCalls = (calls: ApiCall[]) =>
  calls.filter(
    (call) =>
      call.method === 'GET' &&
      call.path === '/notifications' &&
      call.query.get('priority') !== 'high',
  );

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOTIFICATION_NOW);
});
afterEach(() => vi.useRealTimers());

describe('NotificationBell', () => {
  it('names the unread count on the button and shows it on the badge', async () => {
    mockApi(routesWith());
    const { wrapper } = await mountApp(START);
    expect(bell(wrapper).attributes('aria-label')).toBe('Thông báo, 3 chưa đọc');
    expect(wrapper.get('[data-testid="notification-badge"]').text()).toBe('3');
  });

  it('shows no badge at zero and caps it at 99+', async () => {
    mockApi(routesWith({ 'GET /notifications/unread-count': ok({ count: 0 }) }));
    const { wrapper } = await mountApp(START);
    expect(bell(wrapper).attributes('aria-label')).toBe('Thông báo');
    expect(wrapper.find('[data-testid="notification-badge"]').exists()).toBe(false);
    wrapper.unmount();
    mockApi(routesWith({ 'GET /notifications/unread-count': ok({ count: 120 }) }));
    const second = await mountApp(START);
    expect(second.wrapper.get('[data-testid="notification-badge"]').text()).toBe('99+');
  });

  it('renders nothing for an anonymous viewer and asks nothing', async () => {
    const calls = mockApi({
      ...anonymousViewer,
      'GET /pages/no-such-page': fail(404, 'not_found'),
      'GET /notifications/unread-count': ok({ count: 1 }),
    });
    // The 404 page asks only for its flatpage (mocked above), so only the shell could make a notifications request here.
    const { wrapper } = await mountApp('/no-such-page');
    expect(wrapper.find('[data-testid="notification-bell"]').exists()).toBe(false);
    expect(calls.some((call) => call.path.startsWith('/notifications'))).toBe(false);
    expect(userStream()).toBeUndefined();
  });

  it('reads the list only when the drawer opens and shows the latest five, grouped by day', async () => {
    const six = [
      ...inboxSample(),
      notificationItem({ id: 'n-6', lastActivityAt: '2026-09-30T08:00:00Z' }),
    ];
    const calls = mockApi(routesWith({ 'GET /notifications': page(six, { pageSize: 20 }) }));
    const { wrapper } = await mountApp(START);
    expect(listCalls(calls)).toHaveLength(0);
    await openDrawer(wrapper);
    expect(listCalls(calls)[0]!.query.get('state')).toBe('all');
    expect(listCalls(calls)[0]!.query.get('page')).toBe('1');
    expect(drawerRows()).toHaveLength(5);
    expect(drawer()!.textContent).toContain('Hôm nay');
    expect(drawer()!.textContent).toContain('Trước đó');
    expect(drawer()!.querySelector('a[href="/notifications"]')!.textContent).toContain(
      'Xem tất cả thông báo',
    );
  });

  it('shows the sleeping Bit when the inbox is empty', async () => {
    mockApi(
      routesWith({
        'GET /notifications': page([], { pageSize: 20 }),
        'GET /notifications/unread-count': ok({ count: 0 }),
      }),
    );
    const { wrapper } = await mountApp(START);
    await openDrawer(wrapper);
    expect(drawer()!.textContent).toContain('Chưa có thông báo nào.');
    expect(drawer()!.querySelector('[data-testid="inline-bit"]')).not.toBeNull();
  });

  it('marks one row read from its check button and refetches the count', async () => {
    const first = inboxSample()[0]!;
    const calls = mockApi(
      routesWith({
        'GET /notifications/unread-count': sequence(ok({ count: 3 }), ok({ count: 2 })),
        [`POST /notifications/${first.id}/read`]: noContent(),
      }),
    );
    const { wrapper } = await mountApp(START);
    await openDrawer(wrapper);
    drawer()!.querySelector<HTMLElement>(`[aria-label="Đánh dấu đã đọc: ${first.title}"]`)!.click();
    await flushPromises();
    expect(
      calls.some(
        (call) => call.method === 'POST' && call.path === `/notifications/${first.id}/read`,
      ),
    ).toBe(true);
    expect(wrapper.get('[data-testid="notification-badge"]').text()).toBe('2');
  });

  it('sends nothing while viewing as another user', async () => {
    const calls = mockApi({
      ...routesWith({
        'GET /notifications': page([notificationItem({ path: '/notifications' })], {
          pageSize: 20,
        }),
      }),
      ...signedInViewer({ impersonatorId: '0192a000-0000-7000-8000-00000000a001' }),
    });
    const { wrapper, router } = await mountApp(START);
    await openDrawer(wrapper);
    expect(drawer()!.textContent).toContain('Đang xem dưới tên người khác');
    expect(drawer()!.textContent).not.toContain('Đọc hết');
    expect(drawer()!.querySelector('[aria-label^="Đánh dấu đã đọc"]')).toBeNull();
    drawerRows()[0]!.querySelector('button')!.click();
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/notifications'));
    expect(calls.some((call) => call.method === 'POST')).toBe(false);
  });

  it('opens a row: marks it read, goes to its page and closes the drawer', async () => {
    const item = notificationItem({ id: 'n-go', path: '/notifications' });
    const calls = mockApi(
      routesWith({
        'GET /notifications': page([item], { pageSize: 20 }),
        'POST /notifications/n-go/read': noContent(),
      }),
    );
    const { wrapper, router } = await mountApp(START);
    await openDrawer(wrapper);
    drawerRows()[0]!.querySelector('button')!.click();
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/notifications'));
    expect(calls.some((call) => call.path === '/notifications/n-go/read')).toBe(true);
    await vi.waitFor(() => expect(drawer()).toBeNull());
  });

  it('shows a row whose ticket is gone as an old notification and stays', async () => {
    const item = notificationItem({ id: 'n-old', path: '/tickets/t-gone' });
    const calls = mockApi(
      routesWith({
        'GET /notifications': page([item], { pageSize: 20 }),
        'GET /tickets/t-gone': fail(404, 'not_found'),
        'POST /notifications/n-old/read': noContent(),
      }),
    );
    const { wrapper, router } = await mountApp(START);
    await openDrawer(wrapper);
    drawerRows()[0]!.querySelector('button')!.click();
    await flushPromises();
    expect(router.currentRoute.value.path).toBe(START);
    expect(drawerRows()[0]!.textContent).toContain('Thông báo cũ');
    expect(drawerRows()[0]!.textContent).not.toContain(item.title);
    expect(calls.some((call) => call.path === '/notifications/n-old/read')).toBe(true);
  });

  it('refreshes the count once per burst of nudges and announces the rise', async () => {
    const calls = mockApi(
      routesWith({
        'GET /notifications/unread-count': sequence(ok({ count: 3 }), ok({ count: 5 })),
      }),
    );
    const { wrapper } = await mountApp(START);
    const stream = userStream()!;
    expect(stream.url).toBe('/api/internal/events/user');
    // The first load is not news: nothing is announced.
    expect(wrapper.get('[data-testid="notification-arrived"]').text()).toBe('');
    stream.emit('notification', { id: 'a' });
    stream.emit('notification', { id: 'b' });
    stream.emit('notification', { id: 'c' });
    await vi.waitFor(
      () => expect(wrapper.get('[data-testid="notification-badge"]').text()).toBe('5'),
      { timeout: 3000 },
    );
    expect(calls.filter((call) => call.path === '/notifications/unread-count')).toHaveLength(2);
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="notification-arrived"]').text()).toBe('2 thông báo mới'),
    );
  });

  it('re-announces a second rise of the same size (the region empties between them)', async () => {
    mockApi(
      routesWith({
        'GET /notifications/unread-count': sequence(
          ok({ count: 3 }),
          ok({ count: 4 }),
          ok({ count: 5 }),
        ),
      }),
    );
    const { wrapper, queryClient } = await mountApp(START);
    const region = wrapper.get('[data-testid="notification-arrived"]').element;
    const seen: string[] = [];
    new MutationObserver(() => seen.push(region.textContent ?? '')).observe(region, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    const refetch = () =>
      queryClient.refetchQueries({
        queryKey: [...notificationsKey(useViewerId().value), 'unread-count'],
      });
    await refetch();
    await vi.waitFor(() => expect(region.textContent).toBe('1 thông báo mới'));
    await refetch();
    await vi.waitFor(() =>
      expect(wrapper.get('[data-testid="notification-badge"]').text()).toBe('5'),
    );
    await vi.waitFor(() =>
      expect(seen.filter((text) => text === '1 thông báo mới')).toHaveLength(2),
    );
    expect(region.textContent).toBe('1 thông báo mới');
    expect(seen.filter((text) => text === '')).not.toHaveLength(0);
  });

  it('keeps the same stream across session.refresh()', async () => {
    mockApi(routesWith());
    await mountApp(START);
    const first = userStream()!;
    const session = useSessionStore();
    session.user = { ...session.user! };
    await flushPromises();
    session.user = { ...session.user };
    await flushPromises();
    expect(first.closed).toBe(false);
    expect(
      FakeEventSource.instances.filter((source) => source.url.endsWith('/events/user')),
    ).toHaveLength(1);
  });

  it('refetches the lists when the polled count rises without a nudge (contest announcements)', async () => {
    const calls = mockApi(
      routesWith({
        'GET /notifications/unread-count': sequence(ok({ count: 3 }), ok({ count: 5 })),
      }),
    );
    const { wrapper, queryClient } = await mountApp(START);
    await openDrawer(wrapper);
    const before = listCalls(calls).length;
    await queryClient.refetchQueries({
      queryKey: [...notificationsKey(useViewerId().value), 'unread-count'],
    });
    await vi.waitFor(() => expect(listCalls(calls).length).toBeGreaterThan(before));
  });

  it('closes the stream on sign-out and opens a new one for the next account', async () => {
    mockApi(routesWith());
    await mountApp(START);
    const first = userStream()!;
    const session = useSessionStore();
    session.forgetSession();
    await flushPromises();
    expect(first.closed).toBe(true);
    session.user = sessionUser({ id: '0192a000-0000-7000-8000-0000000000b2', username: 'other' });
    await flushPromises();
    expect(userStream()).not.toBe(first);
    expect(userStream()!.closed).toBe(false);
  });

  it('does not reopen a stream the server refused (polling carries on)', async () => {
    mockApi(routesWith());
    await mountApp(START);
    userStream()!.fail();
    await flushPromises();
    expect(
      FakeEventSource.instances.filter((source) => source.url.endsWith('/events/user')),
    ).toHaveLength(1);
  });
});
