import { flushPromises } from '@vue/test-utils';
import type { QueryClient } from '@tanstack/vue-query';
import { useQueryClient } from '@tanstack/vue-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { latestEventSource } from '@/test/fake-event-source';
import { mockApi, ok } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { signedInViewer } from '@/test/problem-routes';
import { useTicketStream } from './use-ticket-stream';

const SETTLE_WAIT_MS = 1100;
let client: QueryClient;

afterEach(() => vi.useRealTimers());

/** Mounts the composable in a probe that shows its announcement and live flag; the probe's client is kept to count refetches. */
async function mountStream(ticketId: string | null) {
  const Probe = defineComponent({
    props: { ticketId: { type: String, default: null } },
    setup(props) {
      client = useQueryClient();
      const { isLive, announcement } = useTicketStream(props.ticketId);
      return () =>
        h(
          'p',
          { 'data-testid': 'announce', 'data-live': String(isLive.value) },
          announcement.value,
        );
    },
  });
  const wrapper = mountComponent(Probe, { props: { ticketId } });
  // The session loads after mount; a viewer change reopens the feed, so the test reads the settled one.
  await flushPromises();
  return wrapper;
}

const frame = (type: string, ticketId: string, open: boolean | null = null) => ({
  type,
  ticketId,
  messageId: null,
  open,
});

describe('useTicketStream on the list', () => {
  it('opens the feed, refetches once and announces one count for a burst of new tickets', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockApi({ ...signedInViewer(), 'GET /tickets': ok([]) });
    const wrapper = await mountStream(null);
    const stream = latestEventSource();
    expect(stream.url).toBe('/api/internal/events/tickets');
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    for (const id of ['t1', 't2', 't3']) stream.emit('new-ticket', frame('new-ticket', id));
    await vi.advanceTimersByTimeAsync(SETTLE_WAIT_MS);
    await flushPromises();
    expect(invalidate.mock.calls).toEqual([[{ queryKey: ['tickets'] }]]);
    expect(wrapper.get('[data-testid="announce"]').text()).toBe('3 phiếu vừa cập nhật');
  });
  it('refetches silently on resync and announces nothing', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mockApi({ ...signedInViewer(), 'GET /tickets': ok([]) });
    const wrapper = await mountStream(null);
    const invalidate = vi.spyOn(client, 'invalidateQueries');
    latestEventSource().emit('resync', {});
    await vi.advanceTimersByTimeAsync(SETTLE_WAIT_MS);
    await flushPromises();
    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(wrapper.get('[data-testid="announce"]').text()).toBe('');
  });
});

describe('useTicketStream on the list: status and connection', () => {
  it('stops reporting live once the browser gives up on the feed', async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets': ok([]) });
    const wrapper = await mountStream(null);
    latestEventSource().fail();
    await flushPromises();
    expect(wrapper.get('[data-testid="announce"]').attributes('data-live')).toBe('false');
  });
});

describe('useTicketStream on one ticket', () => {
  it("follows that ticket's feed", async () => {
    mockApi({ ...signedInViewer(), 'GET /tickets/t1': ok({}) });
    await mountStream('t1');
    expect(latestEventSource().url).toBe('/api/internal/events/tickets/t1');
  });
});
