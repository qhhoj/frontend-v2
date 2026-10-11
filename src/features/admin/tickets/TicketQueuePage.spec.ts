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
});
