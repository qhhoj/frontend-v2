import { describe, expect, it } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { ticketItem } from '@/test/community-fixtures';
import { fail, hangRequestsExcept, mockApi, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';

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
  it('gives staff the creator and assignee filters, nobody else', async () => {
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true }) }),
      'GET /tickets': page([]),
    });
    const staff = (await mountApp('/tickets')).wrapper;
    expect(staff.find('input[name="user"]').exists()).toBe(true);
    mockApi({ ...signedInViewer(), 'GET /tickets': page([]) });
    const member = (await mountApp('/tickets')).wrapper;
    expect(member.find('input[name="user"]').exists()).toBe(false);
  });
});

describe('ticket list states', () => {
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
