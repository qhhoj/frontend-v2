import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { mockApi, ok, page } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { staffViewer } from '@/test/admin-routes';
import { FakeEventSource, installFakeEventSource } from '@/test/fake-event-source';
import { ticketDetail, ticketItem } from '@/test/community-fixtures';

const PERMS = ['judge.change_ticket'];
const routes = (extra = {}) => ({
  ...staffViewer(PERMS),
  'GET /tickets': page([ticketItem({ id: 't-1', title: 'Test 7 sai đáp án' })], { pageSize: 50 }),
  'GET /tickets/t-1': ok(ticketDetail({ id: 't-1', title: 'Test 7 sai đáp án' })),
  ...extra,
});

beforeEach(() => installFakeEventSource());

/** AdminShell and the screen load lazily: wait until the part the test reads is in the DOM. */
const mountQueue = async (path: string, readySelector = 'table') => {
  const mounted = await mountApp(path);
  await vi.waitFor(() => {
    if (!mounted.wrapper.find(readySelector).exists()) throw new Error('queue not yet');
  });
  await flushPromises();
  return mounted;
};

describe('TicketQueuePage', () => {
  it('opens on everyone’s open tickets and shows one beside the list', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountQueue(
      '/admin/tickets?ticket=t-1',
      '[data-testid="ticket-reply"] textarea',
    );
    const request = calls.find((call) => call.path === '/tickets')!;
    expect(request.query.get('open')).toBe('true');
    expect(request.query.get('own')).toBe('false');
    expect(wrapper.get('[data-testid="queue-detail"]').text()).toContain('Test 7 sai đáp án');
  });

  it('asks the server for closed tickets only when "Đã đóng" is chosen, and filters nothing itself', async () => {
    const calls = mockApi(
      routes({
        'GET /tickets': page(
          [
            ticketItem({ id: 't-1', title: 'Phiếu đã đóng', isOpen: false }),
            ticketItem({ id: 't-2', title: 'Phiếu còn mở', isOpen: true }),
          ],
          { pageSize: 50 },
        ),
      }),
    );
    const { wrapper } = await mountQueue('/admin/tickets?scope=all&open=0');
    const request = calls.find((call) => call.path === '/tickets')!;
    expect(request.query.get('open')).toBe('false');
    expect(request.query.get('own')).toBe('false');
    const rows = wrapper.findAll('tbody tr').map((row) => row.text());
    expect(rows).toHaveLength(2);
    expect(rows[0]).toContain('Phiếu đã đóng');
    expect(rows[0]).toContain('Đã đóng');
    expect(rows[1]).toContain('Phiếu còn mở');
    expect(rows[1]).toContain('Mở');
    expect(wrapper.text()).not.toContain('Lọc trên trang hiện tại');
  });

  it('asks for every status when "Tất cả" is chosen, without an open flag at all', async () => {
    const calls = mockApi(routes());
    const { wrapper } = await mountQueue('/admin/tickets?scope=all&open=1');
    await wrapper
      .findAll('input[type="radio"]')
      .find((radio) => radio.attributes('value') === 'all')!
      .setValue(true);
    await flushPromises();
    expect(
      calls
        .filter((call) => call.path === '/tickets')
        .at(-1)!
        .query.has('open'),
    ).toBe(false);
  });

  it('sends the reply, then closes the ticket when asked to', async () => {
    const calls = mockApi(
      routes({
        'POST /tickets/t-1/messages': ok({ id: 'm-9' }),
        'PATCH /tickets/t-1': ok(ticketDetail({ id: 't-1', isOpen: false })),
      }),
    );
    const { wrapper } = await mountQueue(
      '/admin/tickets?ticket=t-1',
      '[data-testid="ticket-reply"] textarea',
    );
    await wrapper.get('[data-testid="ticket-reply"] textarea').setValue('Thầy đã sửa test 7.');
    await wrapper.get('#close-after-reply').setValue(true);
    await wrapper.get('[data-testid="ticket-reply"]').trigger('submit');
    await flushPromises();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(
      expect.arrayContaining(['POST /tickets/t-1/messages', 'PATCH /tickets/t-1']),
    );
    expect(calls.find((call) => call.method === 'PATCH')?.body).toEqual({ isOpen: false });
  });

  it('opens the list stream and the open ticket’s stream, and closes both on leaving', async () => {
    mockApi(routes());
    const { router } = await mountQueue(
      '/admin/tickets?ticket=t-1',
      '[data-testid="ticket-reply"] textarea',
    );
    expect(
      FakeEventSource.instances
        .filter((source) => !source.closed)
        .map((source) => source.url)
        .sort(),
    ).toEqual(['/api/internal/events/tickets', '/api/internal/events/tickets/t-1']);
    await router.push('/admin');
    await flushPromises();
    expect(FakeEventSource.instances.every((source) => source.closed)).toBe(true);
  });
  it('keeps own tickets with both states through a reload', async () => {
    mockApi(routes());
    const { wrapper, router } = await mountQueue('/admin/tickets?scope=all&open=1');
    await wrapper
      .findAll('input[type="radio"]')
      .find((radio) => radio.attributes('value') === 'all')!
      .setValue(true);
    await flushPromises();
    await wrapper.get('input[name="own"]').setValue(true);
    await flushPromises();
    const location = router.currentRoute.value.fullPath;
    expect(location).toBe('/admin/tickets?open=all');
    const calls = mockApi(routes());
    const reloaded = await mountQueue(location);
    const request = calls.find((call) => call.path === '/tickets')!;
    expect(request.query.get('own')).toBe('true');
    expect(request.query.has('open')).toBe(false);
    expect((reloaded.wrapper.get('input[name="own"]').element as HTMLInputElement).checked).toBe(
      true,
    );
    expect(
      (reloaded.wrapper.get('input[type="radio"][value="all"]').element as HTMLInputElement)
        .checked,
    ).toBe(true);
  });

  it('sends no list request after the admin moves to another screen', async () => {
    const calls = mockApi(routes());
    const { router } = await mountQueue('/admin/tickets?scope=all&open=1');
    const listRequests = () => calls.filter((call) => call.path === '/tickets').length;
    const before = listRequests();
    await router.push('/admin');
    await flushPromises();
    expect(listRequests()).toBe(before);
  });
});
