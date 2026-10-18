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

const id = ticketDetail().id;
beforeEach(() => installFakeEventSource());
afterEach(() => vi.useRealTimers());

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

  it.each([
    [409, 'conflict', 'Phiếu đã đạt giới hạn 500 tin nhắn.'],
    [403, 'forbidden', 'Người dùng bị tắt tiếng không thể mở hoặc trả lời phiếu.'],
  ])('explains a refused reply by its code (%i %s)', async (status, code, text) => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: ok(ticketDetail()),
      [`POST /tickets/${id}/messages`]: fail(status, code),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    await wrapper.get('textarea[name="reply"]').setValue('Cảm ơn ạ.');
    await wrapper.get('form[data-testid="ticket-reply"]').trigger('submit');
    await flushPromises();
    expect(wrapper.get('form[data-testid="ticket-reply"]').text()).toContain(text);
  });

  it('does not read a 409 with another code as the message cap', async () => {
    mockApi({
      ...signedInViewer(),
      [`GET /tickets/${id}`]: ok(ticketDetail()),
      [`POST /tickets/${id}/messages`]: fail(409, 'busy'),
    });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    await wrapper.get('textarea[name="reply"]').setValue('Cảm ơn ạ.');
    await wrapper.get('form[data-testid="ticket-reply"]').trigger('submit');
    await flushPromises();
    expect(wrapper.get('form[data-testid="ticket-reply"]').text()).not.toContain('500 tin nhắn');
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
    useSessionStore().user = sessionUser({ id: STAFF_ID, username: 'thayhung', rating: null });
    await flushPromises();
    expect(first.closed).toBe(true);
    expect(latestEventSource()).not.toBe(first);
    expect(latestEventSource().closed).toBe(false);
  });
});

describe('ticket page: staff controls follow the backend permission', () => {
  it('hides every staff control from a viewer whom the backend gives no staff rights', async () => {
    const detail = ticketDetail({ creator: { id: 'x', username: 'bitcoder', rating: null } });
    mockApi({ ...signedInViewer(), [`GET /tickets/${id}`]: ok(detail) });
    const { wrapper } = await mountApp(`/tickets/${id}`);
    expect(wrapper.find('button[data-testid="mark-good"]').exists()).toBe(false);
    expect(wrapper.find('form[data-testid="assignees-form"]').exists()).toBe(false);
    expect(wrapper.find('button[data-testid="toggle-open"]').exists()).toBe(false);
    expect(wrapper.text()).not.toContain('Góc nhìn quản trị viên');
  });
});

const EDITABLE = { editNotes: true, markGood: false, assign: false, claim: false };
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
    const staff = { editNotes: true, markGood: true, assign: true, claim: true };
    mockApi({
      ...signedInViewer({ user: sessionUser({ isStaff: true }) }),
      [`GET /tickets/${id}`]: sequence(
        ok(ticketDetail({ can: staff })),
        ok(
          ticketDetail({
            can: staff,
            assignees: [{ id: 'z', username: 'thayhung', rating: null }],
          }),
        ),
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
