import { flushPromises } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { sessionUser } from '@/test/fixtures';
import { ticketDetail, ticketMessage } from '@/test/community-fixtures';
import { homeRoutes } from '@/test/home-routes';
import { installFakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { fail, mockApi, ok, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';
import { signedInViewer } from '@/test/problem-routes';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';

const id = ticketDetail().id;
beforeEach(() => installFakeEventSource());
afterEach(() => vi.useRealTimers());

describe('ticket page', () => {
  it('shows the creator view: status, link, messages with avatars and the assignee chip, close button', async () => {
    const detail = ticketDetail({
      messages: [
        ticketMessage(),
        ticketMessage({ id: 'm2', author: { id: 'a1', username: 'colan' } }),
      ],
    });
    mockApi({ ...signedInViewer(), [`GET /tickets/${id}`]: ok(detail) });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.get('nav[aria-label="Đường dẫn"]').text()).toContain('#0192a0');
    expect(wrapper.get('[data-testid="ticket-header"]').text()).toContain('Phiếu của bạn');
    const messages = wrapper.get('section[aria-label="Tin nhắn"]');
    expect(messages.findAllComponents(UserAvatar)).toHaveLength(2);
    expect(messages.findAll('article')[1]!.text()).toContain('Người xử lý');
    expect(wrapper.get('button[data-testid="toggle-open"]').text()).toBe('Đóng phiếu');
    expect(wrapper.find('textarea[name="notes"]').exists()).toBe(false);
  });
});

describe('ticket page', () => {
  it('shows the staff view with notes, good-contribution and assignees by permission', async () => {
    const detail = ticketDetail({
      creator: { id: 'x', username: 'minhthu' },
      notes: 'Test 17 sinh sai.',
      can: { editNotes: true, markGood: true, assign: true },
    });
    const calls = mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true }) }),
      [`GET /tickets/${id}`]: ok(detail),
      [`PATCH /tickets/${id}`]: ok({ ...detail, isContributive: true }),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.get('[data-testid="ticket-header"]').text()).toContain('Góc nhìn quản trị viên');
    expect(wrapper.find('[data-testid="ticket-header"] [data-bit-variant="staff"]').exists()).toBe(
      true,
    );
    await wrapper.get('button[data-testid="mark-good"]').trigger('click');
    await flushPromises();
    expect(calls.find((call) => call.method === 'PATCH')!.body).toEqual({ isContributive: true });
    await wrapper.get('input[name="assignees"]').setValue('colan, thayhung');
    await wrapper.get('form[data-testid="assignees-form"]').trigger('submit');
    await flushPromises();
    expect(calls.filter((call) => call.method === 'PATCH')[1]!.body).toEqual({
      assignees: ['colan', 'thayhung'],
    });
  });
});

describe('ticket page', () => {
  it('sends a reply and clears the box', async () => {
    const calls = mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: ok(ticketDetail()),
      [`POST /tickets/${id}/messages`]: ok(ticketMessage({ id: 'm9' })),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    await wrapper.get('textarea[name="reply"]').setValue(' Cảm ơn ạ. ');
    await wrapper.get('form[data-testid="ticket-reply"]').trigger('submit');
    await flushPromises();
    expect(calls.find((call) => call.method === 'POST')!.body).toEqual({ body: 'Cảm ơn ạ.' });
    expect((wrapper.get('textarea[name="reply"]').element as HTMLTextAreaElement).value).toBe('');
  });
});

describe('ticket page', () => {
  it('refetches once and announces one count for a burst of new messages, and closes the stream on leave', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const calls = mockApi({
      ...signedInViewer(),
      ...homeRoutes,
      [`GET /tickets/${id}`]: sequence(ok(ticketDetail()), ok(ticketDetail({ messageCount: 9 }))),
    });
    const { wrapper, router } = await mountApp(`/tickets/${id}`);
    const stream = latestEventSource();
    expect(stream.url).toBe(`/api/internal/events/tickets/${id}`);
    for (let index = 0; index < 5; index += 1)
      stream.emit('ticket-message', {
        type: 'ticket-message',
        ticketId: id,
        messageId: `m${index}`,
        open: null,
      });
    await vi.advanceTimersByTimeAsync(1100);
    await flushPromises();
    expect(calls.filter((call) => call.path === `/tickets/${id}`)).toHaveLength(2);
    expect(wrapper.get('[data-testid="ticket-live"]').text()).toBe('5 tin nhắn mới');
    await router.push('/');
    expect(stream.closed).toBe(true);
  });
});

describe('ticket page', () => {
  it('shows the security Bit when the viewer may not read the ticket, and the crying Bit when it does not exist', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: fail(403, 'forbidden'),
      'GET /tickets/khong-co': fail(404, 'not_found'),
    });
    const forbidden = (await mountApp(`/tickets/${id}`)).wrapper;
    expect(forbidden.get('[data-state="forbidden"]').text()).toContain(
      'Không có quyền xem phiếu này',
    );
    const missing = (await mountApp('/tickets/khong-co')).wrapper;
    expect(missing.get('[data-state="notFound"] h1').text()).toBe('Không tìm thấy phiếu');
  });
});

describe('ticket page', () => {
  it('greets a ticket just sent with the envelope Bit once', async () => {
    mockApi({ ...signedInViewer(), ...homeRoutes, [`GET /tickets/${id}`]: ok(ticketDetail()) });
    const { wrapper, router } = await mountApp('/');
    await router.push({ name: 'ticket', params: { id }, state: { ticketSent: true } });
    await flushPromises();
    expect(wrapper.get('[data-state="sent"]').text()).toContain('Đã gửi phiếu');
  });
});

const OTHER_ID = '0192a000-0000-7000-8000-0000000000b2';
const STAFF_ID = 'staff-account';

describe('ticket page: route and account changes', () => {
  it('loads the other ticket on a route change and closes the feed of the first', async () => {
    mockApi({
      ...signedInViewer(),
      ...homeRoutes,
      [`GET /tickets/${id}`]: ok(ticketDetail()),
      [`GET /tickets/${OTHER_ID}`]: ok(ticketDetail({ id: OTHER_ID, title: 'Phiếu B' })),
    });
    const { wrapper, router } = await mountApp(`/tickets/${id}`);
    const first = latestEventSource();
    await router.push(`/tickets/${OTHER_ID}`);
    await flushPromises();
    expect(first.closed).toBe(true);
    expect(latestEventSource().url).toBe(`/api/internal/events/tickets/${OTHER_ID}`);
    expect(latestEventSource().closed).toBe(false);
    expect(wrapper.get('h1').text()).toBe('Phiếu B');
  });
  it('reopens the feed for the new account when the viewer changes', async () => {
    mockApi({ ...signedInViewer(), ...homeRoutes, [`GET /tickets/${id}`]: ok(ticketDetail()) });
    await mountApp(`/tickets/${id}`);
    const first = latestEventSource();
    useSessionStore().user = sessionUser({ id: STAFF_ID, username: 'thayhung' });
    await flushPromises();
    expect(first.closed).toBe(true);
    expect(latestEventSource()).not.toBe(first);
    expect(latestEventSource().closed).toBe(false);
  });
});

describe('ticket page: staff controls follow the backend permission', () => {
  it('hides every staff control from a viewer whom the backend gives no staff rights', async () => {
    const detail = ticketDetail({ creator: { id: 'x', username: 'minhthu' } });
    mockApi({ ...signedInViewer(), [`GET /tickets/${id}`]: ok(detail) });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.find('button[data-testid="mark-good"]').exists()).toBe(false);
    expect(wrapper.find('form[data-testid="assignees-form"]').exists()).toBe(false);
    expect(wrapper.find('button[data-testid="toggle-open"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Góc nhìn quản trị viên');
  });
  it('shows no assignees form to staff whom the backend does not let assign', async () => {
    const detail = ticketDetail({ creator: { id: 'x', username: 'minhthu' } });
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true }) }),
      [`GET /tickets/${id}`]: ok(detail),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.find('form[data-testid="assignees-form"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Góc nhìn quản trị viên');
  });
});

const EDITABLE = { editNotes: true, markGood: false, assign: false };
describe('ticket page: drafts follow refetches unless edited', () => {
  it('shows the notes the refetch brings when the viewer has not typed', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: sequence(
        ok(ticketDetail({ notes: 'Bản cũ', can: EDITABLE })),
        ok(ticketDetail({ notes: 'Bản mới', can: EDITABLE })),
      ),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect((wrapper.get('textarea[name="notes"]').element as HTMLTextAreaElement).value).toBe(
      'Bản mới',
    );
  });
});

describe('ticket page: drafts follow refetches unless edited', () => {
  it('keeps the notes the viewer is typing when a refetch brings others', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: sequence(
        ok(ticketDetail({ notes: 'Bản cũ', can: EDITABLE })),
        ok(ticketDetail({ notes: 'Bản mới', can: EDITABLE })),
      ),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    await wrapper.get('textarea[name="notes"]').setValue('Đang sửa dở');
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect((wrapper.get('textarea[name="notes"]').element as HTMLTextAreaElement).value).toBe(
      'Đang sửa dở',
    );
  });
});

describe('ticket page: drafts follow refetches unless edited', () => {
  it('shows the assignees the refetch brings when the viewer has not typed', async () => {
    const staff = { editNotes: true, markGood: true, assign: true };
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true }) }),
      [`GET /tickets/${id}`]: sequence(
        ok(ticketDetail({ can: staff })),
        ok(ticketDetail({ can: staff, assignees: [{ id: 'z', username: 'thayhung' }] })),
      ),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect((wrapper.get('input[name="assignees"]').element as HTMLInputElement).value).toBe(
      'thayhung',
    );
  });
});

describe('ticket page: general issue links', () => {
  const general = (url: string) =>
    ticketDetail({ link: { type: 'general', id: 'g', key: null, title: url, url } });
  it('makes a general issue a link only when its address is http or https', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: ok(general('https://example.org/bang')),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    const link = wrapper.get('[data-testid="ticket-header"] a[target="_blank"]');
    expect(link.attributes('href')).toBe('https://example.org/bang');
    expect(link.attributes('rel')).toBe('noopener noreferrer');
  });
  it('shows a javascript address as plain text, never as a link', async () => {
    mockApi({ ...signedInViewer(), [`GET /tickets/${id}`]: ok(general('javascript:alert(1)')) });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.find('[data-testid="ticket-header"] a[target="_blank"]').exists()).toBe(false);
    expect(wrapper.get('[data-testid="ticket-header"]').text()).toContain('javascript:alert(1)');
  });
});
