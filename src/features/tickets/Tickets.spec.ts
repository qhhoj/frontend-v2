import { flushPromises } from '@vue/test-utils';
import type { VueWrapper } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { ticketItem } from '@/test/community-fixtures';
import { fail, hangRequestsExcept, mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

const CHANGE_TICKET = 'judge.change_ticket';

const closedGeneral = ticketItem({
  id: 't2',
  link: { type: 'general', id: 'g', key: null, title: 'https://x', url: 'https://x' },
  assignees: [],
  isOpen: false,
  isContributive: true,
});

describe('ticket list', () => {
  it('lists the viewer’s own tickets by default with link, status, assignees, messages and update time', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      'GET /tickets': page([ticketItem(), closedGeneral], { pageSize: 50, total: 2 }),
    });
    const { wrapper } = await mountApp('/tickets');
    expect(calls.find((call) => call.path === '/tickets')!.query.get('own')).toBe('true');
    const rows = wrapper.findAll('tbody tr');
    expect(rows[0]!.text()).toContain('hcmus41b');
    expect(rows[0]!.text()).toContain('Đang mở');
    expect(rows[0]!.text()).toContain('colan');
    expect(rows[1]!.text()).toContain('Vấn đề chung');
    expect(rows[1]!.text()).toContain('Đã đóng');
    expect(rows[1]!.text()).toContain('Đóng góp tốt');
    expect(rows[1]!.text()).toContain('Chưa phân công');
    expect(rows[0]!.get('a').attributes('href')).toBe(`/tickets/${ticketItem().id}`);
  });
  it('switches to every visible ticket and to open ones through links', async () => {
    const calls = mockApi({ ...signedInViewer(), 'GET /tickets': page([]) });
    await mountApp('/tickets?scope=all&open=1');
    const query = calls.find((call) => call.path === '/tickets')!.query;
    expect([query.get('own'), query.get('open')]).toEqual(['false', 'true']);
  });
  it('asks the list for closed tickets only when the URL says open=0', async () => {
    const calls = mockApi({ ...signedInViewer(), 'GET /tickets': page([closedGeneral]) });
    const { wrapper } = await mountApp('/tickets?open=0');
    expect(calls.find((call) => call.path === '/tickets')!.query.get('open')).toBe('false');
    expect(wrapper.get('nav[aria-label="Trạng thái"] [aria-current="page"]').text()).toBe(
      'Đã đóng',
    );
  });
});

describe('ticket list: staff and closed filters', () => {
  it('gives the creator and assignee filters to the judge.change_ticket permission, not to the staff flag', async () => {
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true, permissions: [] }) }),
      'GET /tickets': page([]),
    });
    expect((await mountApp('/tickets')).wrapper.find('input[name="user"]').exists()).toBe(false);
    mockApi({
      ...signedInViewer({ user: sessionUser({ permissions: [CHANGE_TICKET] }) }),
      'GET /tickets': page([]),
    });
    expect((await mountApp('/tickets')).wrapper.find('input[name="user"]').exists()).toBe(true);
  });
  it('shows the sleeping Bit with a new-ticket link when the viewer has none', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': page([]) });
    const { wrapper } = await mountApp('/tickets');
    const state = wrapper.get('[data-state="empty"]');
    expect(state.text()).toContain('Bạn chưa tạo phiếu nào');
    expect(state.get('a').attributes('href')).toBe('/tickets/new');
  });
  it('shows the sweating Bit with retry on a failed load', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': fail(503, 'network_error') });
    const { wrapper } = await mountApp('/tickets');
    expect(wrapper.get('[data-state="error"]').text()).toContain('Không tải được phiếu');
  });
  it('asks to sign in when the session has expired', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': fail(401, 'unauthorized') });
    const { wrapper } = await mountApp('/tickets');
    expect(wrapper.get('[data-state="signIn"]').get('a').attributes('href')).toContain('/login');
  });
  it('shows a table skeleton with the real header while loading', async () => {
    mockApi({ ...signedInViewer() });
    hangRequestsExcept(['/auth/me', '/profile']);
    const { wrapper } = await mountApp('/tickets');
    expect(wrapper.get('[data-testid="query-skeleton"]').findAll('thead th')).toHaveLength(5);
  });
});

describe('ticket list: applying staff filters', () => {
  const staffRoutes = () =>
    mockApi({
      ...signedInViewer({ user: sessionUser({ permissions: [CHANGE_TICKET] }) }),
      'GET /tickets': page([]),
    });
  it('applies typed usernames on Enter and goes back to the first page', async () => {
    staffRoutes();
    const { wrapper, router } = await mountApp('/tickets?page=3');
    await wrapper.get('input[name="user"]').setValue('colan, thayhung');
    await wrapper.get('form').trigger('submit');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ user: 'colan,thayhung' });
  });
  it('applies the assignee filter when its field loses focus', async () => {
    staffRoutes();
    const { wrapper, router } = await mountApp('/tickets');
    await wrapper.get('input[name="assignee"]').setValue('colan');
    await wrapper.get('input[name="assignee"]').trigger('blur');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ assignee: 'colan' });
  });
});

describe('ticket list: tab links', () => {
  const tabNamed = (wrapper: VueWrapper, name: string) =>
    wrapper.findAll('nav a').find((link) => link.text() === name)!;
  it('the closed tab keeps the scope and writes open=0', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': page([]) });
    const { wrapper, router } = await mountApp('/tickets?scope=all');
    await tabNamed(wrapper, 'Đã đóng').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ scope: 'all', open: '0' });
  });
  it('the all-visible tab keeps the open filter and drops the own scope', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': page([]) });
    const { wrapper, router } = await mountApp('/tickets?open=1');
    await tabNamed(wrapper, 'Tất cả phiếu tôi xem được').trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ scope: 'all', open: '1' });
  });
});

describe('ticket list: staff inputs follow the route', () => {
  const typeCreator = async (wrapper: VueWrapper, text: string) => {
    const input = wrapper.get('input[name="user"]');
    await input.setValue(text);
    await input.trigger('blur');
    await flushPromises();
  };
  it('shows the restored filters after Back, and a blur does not push the older text', async () => {
    mockApi({
      ...signedInViewer({ user: sessionUser({ permissions: [CHANGE_TICKET] }) }),
      'GET /tickets': page([]),
    });
    const { wrapper, router } = await mountApp('/tickets');
    await typeCreator(wrapper, 'alpha');
    await typeCreator(wrapper, 'bravo');
    router.back();
    await vi.waitFor(() =>
      expect((wrapper.get('input[name="user"]').element as HTMLInputElement).value).toBe('alpha'),
    );
    await wrapper.get('input[name="user"]').trigger('blur');
    await flushPromises();
    expect(router.currentRoute.value.query).toEqual({ user: 'alpha' });
  });
});
