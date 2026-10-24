import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { inboxSample, NOTIFICATION_NOW } from '@/test/notification-fixtures';
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
  it('asks only the chosen state and marks its filter current', async () => {
    const calls = mockApi(routesWith());
    const { wrapper } = await mountApp('/notifications?state=read&page=2');
    expect(listCalls(calls)[0]!.query.get('state')).toBe('read');
    expect(listCalls(calls)[0]!.query.get('page')).toBe('2');
    expect(
      main(wrapper).get('a[href="/notifications?state=read"]').attributes('aria-current'),
    ).toBe('page');
  });

  it("filters by kind chip: sends the chip's kinds, keeps the state and names the chip when empty", async () => {
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
});
