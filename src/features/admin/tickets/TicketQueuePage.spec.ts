import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises } from '@vue/test-utils';
import { fail, mockApi, ok, page, sequence } from '@/test/mock-api';
import { mountApp } from '@/test/mount';
import { STAFF_ID, staffViewer } from '@/test/admin-routes';
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

  it('keeps the pinned reply to one row until it is used, and shows the time since the last message beside a ticket', async () => {
    mockApi(routes());
    const { wrapper } = await mountQueue(
      '/admin/tickets?ticket=t-1',
      '[data-testid="ticket-reply"] textarea',
    );
    const reply = () => wrapper.get('[data-testid="ticket-reply"]');
    expect(reply().attributes('data-folded')).toBe('true');
    expect(wrapper.find('#close-after-reply').exists()).toBe(false);
    await reply().get('textarea').trigger('focusin');
    expect(reply().attributes('data-folded')).toBeUndefined();
    expect(wrapper.find('#close-after-reply').exists()).toBe(true);
    await reply().get('textarea').trigger('focusout', { relatedTarget: null });
    expect(reply().attributes('data-folded')).toBe('true');

    const table = wrapper.get('table');
    expect(table.findAll('th').map((th) => th.text())).not.toContain('Trạng thái');
    expect(table.get('td time').attributes('title')).toMatch(/\d{4}/);
  });

  it('follows the pinned reply box with the page scroll padding when the ticket arrives after the pane', async () => {
    mockApi(routes());
    const answer = globalThis.fetch;
    let release = () => {};
    const held = new Promise<void>((resolve) => (release = resolve));
    vi.stubGlobal('fetch', async (input: string, init?: RequestInit) => {
      if (new URL(input, 'http://localhost').pathname.endsWith('/tickets/t-1')) await held;
      return answer(input, init);
    });
    const observed: Element[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe = (element: Element) => {
          observed.push(element);
        };
        unobserve() {}
        disconnect() {}
      },
    );
    // jsdom has no layout: the reply box reads as pinned and 60 px tall, everything else as neither; opening the
    // ticket scrolls its newest message into view.
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;
    const isReplyBox = (element: Element) =>
      element instanceof HTMLElement && element.dataset.testid === 'queue-reply';
    const realStyle = window.getComputedStyle.bind(window);
    const styleSpy = vi
      .spyOn(window, 'getComputedStyle')
      .mockImplementation((element, pseudo) =>
        isReplyBox(element)
          ? ({ position: 'sticky' } as CSSStyleDeclaration)
          : realStyle(element, pseudo),
      );
    const height = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
    Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
      configurable: true,
      get(this: HTMLElement) {
        return isReplyBox(this) ? 60 : 0;
      },
    });
    try {
      const { wrapper, router } = await mountQueue(
        '/admin/tickets?ticket=t-1',
        '[data-testid="queue-detail"]',
      );
      expect(wrapper.find('[data-testid="queue-reply"]').exists()).toBe(false);
      release();
      await vi.waitFor(() => {
        if (!wrapper.find('[data-testid="queue-reply"]').exists())
          throw new Error('ticket not yet');
      });
      await flushPromises();
      expect(observed).toContain(wrapper.get('[data-testid="queue-reply"]').element);
      expect(document.documentElement.style.scrollPaddingBottom).toBe('76px');
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      await router.replace('/admin/tickets');
      await flushPromises();
      expect(document.documentElement.style.scrollPaddingBottom).toBe('');
    } finally {
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', height);
      styleSpy.mockRestore();
    }
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

  describe('handling', () => {
    const HANDLER = { assign: true, editNotes: true, markGood: true, claim: true };
    const ME = { id: STAFF_ID, username: 'bitcoder', rating: null };
    const unhandled = ticketDetail({ id: 't-1', assignees: [], can: HANDLER });

    it('takes an unhandled ticket in one click, then offers to hand it back', async () => {
      const mine = { ...unhandled, assignees: [ME] };
      const calls = mockApi(
        routes({
          'GET /tickets/t-1': sequence(ok(unhandled), ok(mine)),
          'POST /tickets/t-1/claim': ok(mine),
        }),
      );
      const { wrapper } = await mountQueue(
        '/admin/tickets?ticket=t-1',
        '[data-testid="ticket-claim"]',
      );
      await wrapper.get('[data-testid="ticket-claim"]').trigger('click');
      await flushPromises();
      expect(callsOf(calls, 'POST /tickets/t-1/claim')).toHaveLength(1);
      await vi.waitFor(() =>
        expect(wrapper.find('[data-testid="ticket-release"]').exists()).toBe(true),
      );
      expect(wrapper.find('[data-testid="ticket-claim"]').exists()).toBe(false);
    });

    it('says someone else took the ticket first and reloads it to show who', async () => {
      const taken = { ...unhandled, assignees: [{ id: 'u-2', username: 'user_02', rating: null }] };
      const calls = mockApi(
        routes({
          'GET /tickets/t-1': sequence(ok(unhandled), ok(taken)),
          'POST /tickets/t-1/claim': fail(409, 'ticket_claimed'),
        }),
      );
      const { wrapper } = await mountQueue(
        '/admin/tickets?ticket=t-1',
        '[data-testid="ticket-claim"]',
      );
      await wrapper.get('[data-testid="ticket-claim"]').trigger('click');
      await flushPromises();
      expect(wrapper.text()).toContain('Người khác vừa nhận phiếu này');
      await vi.waitFor(() =>
        expect(wrapper.get('[data-testid="ticket-handled-by"]').text()).toContain('user_02'),
      );
      expect(callsOf(calls, 'GET /tickets/t-1').length).toBeGreaterThan(1);
    });

    it('saves handlers, notes and title in one PATCH carrying only what changed', async () => {
      const calls = mockApi(
        routes({ 'GET /tickets/t-1': ok(unhandled), 'PATCH /tickets/t-1': ok(unhandled) }),
      );
      const { wrapper } = await mountQueue(
        '/admin/tickets?ticket=t-1',
        '[data-testid="ticket-handling"]',
      );
      const section = wrapper.get('[data-testid="ticket-handling"]');
      await section.get('input[name="assignees"]').setValue('user_01, user_02 user_01');
      await section.get('textarea[name="notes"]').setValue('Đã báo người ra đề.');
      await section.get('form').trigger('submit');
      await flushPromises();
      const patches = callsOf(calls, 'PATCH /tickets/t-1');
      expect(patches.map((call) => call.body)).toEqual([
        { assignees: ['user_01', 'user_02'], notes: 'Đã báo người ra đề.' },
      ]);
    });

    it('sends nothing when the section is saved unchanged', async () => {
      const calls = mockApi(routes({ 'GET /tickets/t-1': ok(unhandled) }));
      const { wrapper } = await mountQueue(
        '/admin/tickets?ticket=t-1',
        '[data-testid="ticket-handling"]',
      );
      await wrapper.get('[data-testid="ticket-handling"] form').trigger('submit');
      await flushPromises();
      expect(callsOf(calls, 'PATCH /tickets/t-1')).toEqual([]);
    });
  });

  it('opens a problem setter on the open tickets about their problems, without the staff-only tools', async () => {
    const calls = mockApi({
      ...routes(),
      ...staffViewer(['judge.edit_own_problem']),
    });
    const { wrapper } = await mountQueue('/admin/tickets');
    const list = callsOf(calls, 'GET /tickets')[0]!;
    expect(Object.fromEntries(list.query)).toMatchObject({
      aboutMine: 'true',
      own: 'false',
      open: 'true',
    });
    expect(wrapper.find('input[name="awaiting"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="queue-about-mine"] input').element).toHaveProperty(
      'checked',
      true,
    );
  });
});

function callsOf(calls: ReturnType<typeof mockApi>, route: string) {
  return calls.filter((call) => `${call.method} ${call.path}` === route);
}
