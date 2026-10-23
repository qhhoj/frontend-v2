import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query';
import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick, ref } from 'vue';
import type { Ref } from 'vue';
import { FakeEventSource, latestEventSource } from '@/test/fake-event-source';
import { RETRY_DELAYS_MS, isLiveStreamPaused, reconnectLiveStream, useLiveStream } from './events';
import type { LiveStream, LiveStreamOptions, LiveTarget } from './events';

type TicketRoute = '/events/tickets/{id}';
const ticket = (id: string, viewer?: string): LiveTarget<TicketRoute> => ({
  route: '/events/tickets/{id}',
  params: { id },
  viewer,
});
const frame = { type: 'ticket-message', ticketId: 't1', messageId: 'm1', open: null };

/** Holds a stream in a mounted probe; `client` is the probe's query client, its invalidations are counted. */
function hold(
  target: Ref<LiveTarget<TicketRoute> | null>,
  options: Partial<LiveStreamOptions<TicketRoute>> = {},
) {
  const client = new QueryClient();
  const invalidate = vi.spyOn(client, 'invalidateQueries');
  let live!: LiveStream;
  const wrapper = mount(
    defineComponent({
      setup() {
        live = useLiveStream(target, { frames: {}, ...options });
        return () => null;
      },
    }),
    { global: { plugins: [[VueQueryPlugin, { queryClient: client }]] } },
  );
  return { live, wrapper, invalidate };
}

describe('useLiveStream: connecting and frames', () => {
  it('opens the internal API path with encoded parameters', () => {
    hold(ref(ticket('a b')));
    expect(latestEventSource().url).toBe('/api/internal/events/tickets/a%20b');
  });

  it('hands each named frame to its own handler as parsed JSON', () => {
    const onMessage = vi.fn();
    const onStatus = vi.fn();
    hold(ref(ticket('t1')), { frames: { 'ticket-message': onMessage, 'ticket-status': onStatus } });
    latestEventSource().emit('ticket-message', frame);
    expect(onMessage).toHaveBeenCalledWith(frame);
    expect(onStatus).not.toHaveBeenCalled();
  });

  it('skips a frame that is not a JSON object', () => {
    const onMessage = vi.fn();
    hold(ref(ticket('t1')), { frames: { 'ticket-message': onMessage } });
    for (const raw of ['{broken', 'null', '"text"'])
      latestEventSource().emit('ticket-message', raw, true);
    expect(onMessage).not.toHaveBeenCalled();
  });
});

describe('useLiveStream: malformed frames', () => {
  it('drops a frame missing the id its handler relies on, and delivers a valid one', () => {
    const onDone = vi.fn();
    const onAnnouncement = vi.fn();
    const target = ref<LiveTarget<TicketRoute> | null>(ticket('t1'));
    hold(target, {
      frames: {
        done: onDone,
        announcement: onAnnouncement,
      } as unknown as LiveStreamOptions<TicketRoute>['frames'],
    });
    const source = latestEventSource();
    source.emit('done', { type: 'done' });
    source.emit('done', { submissionId: 7 });
    source.emit('announcement', { text: 'x' });
    expect(onDone).not.toHaveBeenCalled();
    expect(onAnnouncement).not.toHaveBeenCalled();
    source.emit('done', { submissionId: 's1' });
    source.emit('announcement', { announcementId: 'a1' });
    expect(onDone).toHaveBeenCalledExactlyOnceWith({ submissionId: 's1' });
    expect(onAnnouncement).toHaveBeenCalledExactlyOnceWith({ announcementId: 'a1' });
  });
});

describe('useLiveStream: lifecycle', () => {
  it('reopens when the path or the viewer changes, not when the same target is rebuilt', async () => {
    const target = ref<LiveTarget<TicketRoute> | null>(ticket('t1', 'u1'));
    hold(target);
    const first = latestEventSource();
    target.value = ticket('t1', 'u1');
    await nextTick();
    expect(latestEventSource()).toBe(first);
    target.value = ticket('t1', 'u2');
    await nextTick();
    expect(first.closed).toBe(true);
    target.value = ticket('t2', 'u2');
    await nextTick();
    expect(FakeEventSource.instances.map((source) => source.url.split('/').at(-1))).toEqual([
      't1',
      't1',
      't2',
    ]);
  });

  it('stops delivering once the target is cleared, and says so once', async () => {
    const onMessage = vi.fn();
    const onClose = vi.fn();
    const target = ref<LiveTarget<TicketRoute> | null>(ticket('t1'));
    hold(target, { frames: { 'ticket-message': onMessage }, onClose });
    const source = latestEventSource();
    target.value = null;
    await nextTick();
    source.emit('ticket-message', frame);
    expect(source.closed).toBe(true);
    expect(onMessage).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('stays closed after close() until reconnect, and closes on unmount', async () => {
    const { live, wrapper } = hold(ref(ticket('t1')));
    live.close();
    await nextTick();
    expect(FakeEventSource.instances.map((source) => source.closed)).toEqual([true]);
    live.reconnect();
    await nextTick();
    wrapper.unmount();
    expect(FakeEventSource.instances.map((source) => source.closed)).toEqual([true, true]);
  });
});

const [FIRST_DELAY = 0, SECOND_DELAY = 0] = RETRY_DELAYS_MS;

describe('useLiveStream: dropped connections', () => {
  it('gives up at once when the server refused the stream', () => {
    const onGiveUp = vi.fn();
    const { live } = hold(ref(ticket('t1')), { onGiveUp });
    latestEventSource().fail();
    expect(live.paused.value).toBe(true);
    expect(onGiveUp).toHaveBeenCalledOnce();
  });

  it('reopens after a network error with growing waits, then pauses once the retries are used up', () => {
    vi.useFakeTimers();
    try {
      const onGiveUp = vi.fn();
      const { live } = hold(ref(ticket('t1')), { onGiveUp });
      for (const delay of RETRY_DELAYS_MS) {
        const failed = latestEventSource();
        failed.fail(true);
        expect(live.paused.value).toBe(false);
        vi.advanceTimersByTime(delay - 1);
        expect(latestEventSource()).toBe(failed);
        vi.advanceTimersByTime(1);
        expect(latestEventSource()).not.toBe(failed);
      }
      latestEventSource().fail(true);
      expect(live.paused.value).toBe(true);
      expect(onGiveUp).toHaveBeenCalledOnce();
    } finally {
      vi.useRealTimers();
    }
  });

  it('restarts the retry count once a reopened connection is open', () => {
    vi.useFakeTimers();
    try {
      const { live } = hold(ref(ticket('t1')));
      for (let round = 0; round < RETRY_DELAYS_MS.length * 2; round += 1) {
        latestEventSource().fail(true);
        vi.advanceTimersByTime(FIRST_DELAY);
        latestEventSource().emit('open', {});
      }
      expect(live.paused.value).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it('delivers frames from a reopened connection and stops reopening after close()', () => {
    vi.useFakeTimers();
    try {
      const onMessage = vi.fn();
      const { live } = hold(ref(ticket('t1')), { frames: { 'ticket-message': onMessage } });
      latestEventSource().fail(true);
      vi.advanceTimersByTime(FIRST_DELAY);
      latestEventSource().emit('ticket-message', frame);
      expect(onMessage).toHaveBeenCalledOnce();
      const before = FakeEventSource.instances.length;
      latestEventSource().fail(true);
      live.close();
      vi.advanceTimersByTime(SECOND_DELAY);
      expect(FakeEventSource.instances).toHaveLength(before);
    } finally {
      vi.useRealTimers();
    }
  });

  it('reconnects with a new connection, clears the pause and refreshes the cached reads', async () => {
    const onMessage = vi.fn();
    const { live, invalidate } = hold(ref(ticket('t1')), {
      frames: { 'ticket-message': onMessage },
      cacheKey: () => ['tickets'],
    });
    const dropped = latestEventSource();
    dropped.fail();
    live.reconnect();
    await nextTick();
    expect(live.paused.value).toBe(false);
    expect(latestEventSource()).not.toBe(dropped);
    expect(invalidate.mock.calls).toEqual([[{ queryKey: ['tickets'] }]]);
    latestEventSource().emit('ticket-message', frame);
    expect(onMessage).toHaveBeenCalledOnce();
  });

  it('lets a page that does not own the stream read its pause and reconnect it', async () => {
    const { invalidate } = hold(ref(ticket('t1')), { cacheKey: () => ['tickets'] });
    expect(isLiveStreamPaused(ticket('t1'))).toBe(false);
    latestEventSource().fail();
    expect(isLiveStreamPaused(ticket('t1'))).toBe(true);
    const dropped = latestEventSource();
    reconnectLiveStream(ticket('t1'));
    await nextTick();
    expect(latestEventSource()).not.toBe(dropped);
    expect(isLiveStreamPaused(ticket('t1'))).toBe(false);
    expect(invalidate).toHaveBeenCalledOnce();
  });

  it('forgets a closed stream: its path reads as not paused', async () => {
    const target = ref<LiveTarget<TicketRoute> | null>(ticket('t1'));
    hold(target);
    latestEventSource().fail();
    target.value = null;
    await nextTick();
    expect(isLiveStreamPaused(ticket('t1'))).toBe(false);
  });
});

describe('useLiveStream: cached reads', () => {
  it('invalidates the cached reads on a resync frame', async () => {
    const { invalidate } = hold(ref(ticket('t1')), { cacheKey: () => ['tickets', 't1'] });
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect(invalidate.mock.calls).toEqual([[{ queryKey: ['tickets', 't1'] }]]);
  });

  it('leaves a resync to the caller that handles it', async () => {
    const onResync = vi.fn();
    const { invalidate } = hold(ref(ticket('t1')), {
      frames: { resync: onResync },
      cacheKey: () => ['tickets'],
    });
    latestEventSource().emit('resync', {});
    await flushPromises();
    expect(onResync).toHaveBeenCalledOnce();
    expect(invalidate).not.toHaveBeenCalled();
  });

  it('refresh invalidates the current key', async () => {
    const id = ref('t1');
    const { live, invalidate } = hold(ref(ticket('t1')), { cacheKey: () => ['tickets', id.value] });
    id.value = 't2';
    await live.refresh();
    expect(invalidate.mock.calls).toEqual([[{ queryKey: ['tickets', 't2'] }]]);
  });
});
