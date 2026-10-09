import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi, noContent, ok, page, rateLimited } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { inboxSample, NOTIFICATION_NOW, notificationItem } from '@/test/notification-fixtures';
import { signedInViewer } from '@/test/problem-routes';

const routesWith = (extra: Record<string, MockHandler> = {}) => ({
  ...signedInViewer(),
  'GET /notifications/unread-count': ok({ count: 3 }),
  'GET /notifications': page(inboxSample(), { pageSize: 20 }),
  ...extra,
});
/** The page's list reads; the high-priority banner's read (Task 5) is left out. */
const listCalls = (calls: ApiCall[]) =>
  calls.filter(
    (call) =>
      call.method === 'GET' &&
      call.path === '/notifications' &&
      call.query.get('priority') !== 'high',
  );
const main = (wrapper: VueWrapper) => wrapper.get('main');
const buttonNamed = (wrapper: VueWrapper, name: string) =>
  main(wrapper)
    .findAll('button')
    .find((button) => button.text() === name);

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOTIFICATION_NOW);
});
afterEach(() => vi.useRealTimers());

describe('NotificationsPage', () => {
  it('lists every notification grouped by day, with the unread count on its filter', async () => {
    const calls = mockApi(routesWith());
    const { wrapper } = await mountApp('/notifications');
    expect(listCalls(calls)[0]!.query.get('state')).toBe('all');
    expect(main(wrapper).find('h1').text()).toBe('Thông báo');
    expect(main(wrapper).findAll('[data-testid="notification-row"]')).toHaveLength(5);
    expect(main(wrapper).text()).toContain('Hôm nay');
    const unreadLink = main(wrapper).get('a[href="/notifications?state=unread"]');
    expect(unreadLink.text()).toContain('3');
    expect(main(wrapper).get('a[href="/notifications"]').attributes('aria-current')).toBe('page');
  });

  it('asks only the chosen state and marks its filter current', async () => {
    const calls = mockApi(routesWith());
    const { wrapper } = await mountApp('/notifications?state=read&page=2');
    expect(listCalls(calls)[0]!.query.get('state')).toBe('read');
    expect(listCalls(calls)[0]!.query.get('page')).toBe('2');
    expect(
      main(wrapper).get('a[href="/notifications?state=read"]').attributes('aria-current'),
    ).toBe('page');
  });

  it('shows the sleeping Bit for an empty inbox', async () => {
    mockApi(
      routesWith({
        'GET /notifications': page([], { pageSize: 20 }),
        'GET /notifications/unread-count': ok({ count: 0 }),
      }),
    );
    const { wrapper } = await mountApp('/notifications');
    expect(main(wrapper).text()).toContain('Chưa có thông báo nào.');
    expect(main(wrapper).text()).toContain('Bạn đã xem hết mọi thứ.');
  });

  it('says a filter is empty and offers the whole inbox', async () => {
    mockApi(routesWith({ 'GET /notifications': page([], { pageSize: 20 }) }));
    const { wrapper } = await mountApp('/notifications?state=read');
    expect(main(wrapper).text()).toContain('Chưa có thông báo đã đọc.');
    expect(main(wrapper).text()).toContain('Đổi bộ lọc để xem các thông báo khác.');
    const back = main(wrapper)
      .findAll('a')
      .find((link) => link.text() === 'Bỏ bộ lọc');
    expect(back!.attributes('href')).toBe('/notifications');
  });

  it("filters by kind chip: sends the chip's kinds, keeps the state and names the chip when empty (requires VNOI backend B1 ask)", async () => {
    const calls = mockApi(routesWith({ 'GET /notifications': page([], { pageSize: 20 }) }));
    const { wrapper } = await mountApp('/notifications?state=unread&kind=organization');
    expect(listCalls(calls)[0]!.query.getAll('kind')).toEqual(['organization-request-decided']);
    expect(main(wrapper).text()).toContain('Không có thông báo loại “Tổ chức” chưa đọc');
    expect(main(wrapper).get('a[href="/notifications?state=unread"]').text()).toContain('Tổ chức');
    const unreadLink = main(wrapper)
      .findAll('nav a')
      .find((link) => link.text().startsWith('Chưa đọc'));
    expect(unreadLink!.attributes('href')).toBe('/notifications?state=unread&kind=organization');
  });

  it('sends a multi-kind chip as repeated kind parameters', async () => {
    const calls = mockApi(routesWith());
    await mountApp('/notifications?kind=ticket');
    expect(listCalls(calls)[0]!.query.getAll('kind')).toEqual([
      'ticket-new',
      'ticket-message',
      'ticket-status',
    ]);
    expect(listCalls(calls)[0]!.query.getAll('kind')).toHaveLength(3);
  });

  it('offers the "Khác" chip and asks for the quota warning kind only', async () => {
    const calls = mockApi(routesWith());
    const { wrapper } = await mountApp('/notifications?kind=other');
    expect(listCalls(calls)[0]!.query.getAll('kind')).toEqual(['quota-warning']);
    expect(
      main(wrapper)
        .findAll('a')
        .some((link) => link.text().startsWith('Khác')),
    ).toBe(true);
  });

  it('counts every status in the rail: all, unread and read = all - unread', async () => {
    mockApi(routesWith({ 'GET /notifications': page(inboxSample(), { pageSize: 20, total: 6 }) }));
    const { wrapper } = await mountApp('/notifications');
    const counts = main(wrapper)
      .findAll('nav a')
      .slice(0, 3)
      .map((link) => link.text());
    expect(counts).toEqual(['Tất cả6', 'Chưa đọc3', 'Đã đọc3']);
  });

  it('shows the load error with a retry', async () => {
    mockApi(routesWith({ 'GET /notifications': fail(503, 'network_error') }));
    const { wrapper } = await mountApp('/notifications');
    expect(main(wrapper).get('[role="alert"]').text()).toContain('Không kết nối được máy chủ.');
    expect(buttonNamed(wrapper, 'Thử lại')).toBeDefined();
  });

  it('marks everything read once on a double click and says so', async () => {
    const calls = mockApi(routesWith({ 'POST /notifications/read-all': noContent() }));
    const { wrapper } = await mountApp('/notifications');
    const button = buttonNamed(wrapper, 'Đánh dấu tất cả đã đọc')!;
    await button.trigger('click');
    await button.trigger('click');
    await flushPromises();
    expect(calls.filter((call) => call.path === '/notifications/read-all')).toHaveLength(1);
    expect(main(wrapper).text()).toContain('Đã đánh dấu tất cả là đã đọc.');
  });

  it('says why a read-all was refused', async () => {
    mockApi(routesWith({ 'POST /notifications/read-all': rateLimited(30) }));
    const { wrapper } = await mountApp('/notifications');
    await buttonNamed(wrapper, 'Đánh dấu tất cả đã đọc')!.trigger('click');
    await flushPromises();
    expect(main(wrapper).text()).toContain('Bạn thao tác quá nhanh. Hãy thử lại sau.');
  });

  it('offers no read action while viewing as another user', async () => {
    mockApi({
      ...routesWith(),
      ...signedInViewer({ impersonatorId: '0192a000-0000-7000-8000-00000000a001' }),
    });
    const { wrapper } = await mountApp('/notifications');
    expect(buttonNamed(wrapper, 'Đánh dấu tất cả đã đọc')).toBeUndefined();
    expect(main(wrapper).text()).toContain('Đang xem dưới tên người khác');
    expect(main(wrapper).find('[aria-label^="Đánh dấu đã đọc"]').exists()).toBe(false);
  });

  it('keeps a row whose target is gone as an old notification and explains it', async () => {
    const gone = notificationItem({
      id: 'n-old',
      path: '/tickets/t-gone',
      title: 'Phiếu cũ của bạn',
    });
    mockApi(
      routesWith({
        'GET /notifications': page([gone], { pageSize: 20 }),
        'GET /tickets/t-gone': fail(403, 'forbidden'),
        'POST /notifications/n-old/read': noContent(),
      }),
    );
    const { wrapper, router } = await mountApp('/notifications');
    await main(wrapper).get('[data-testid="notification-row"] button').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.path).toBe('/notifications');
    expect(main(wrapper).get('[data-testid="notification-row"]').text()).toContain('Thông báo cũ');
    expect(main(wrapper).text()).toContain('không còn mở được');
  });
});
