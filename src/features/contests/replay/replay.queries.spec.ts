import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { sessionUser, signedOut } from '@/test/fixtures';
import { fail, mockApi, sequence } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { buildingChunk, replayChunk } from '@/test/replay-fixtures';
import {
  NOT_READY_MAX_POLL_MS,
  notReadyPollMs,
  REPLAY_POLL_MS,
  useReplayQuery,
} from './replay.queries';

const ROUTE = 'GET /contests/r41/replay';
const building = { status: 202, body: { data: buildingChunk() } };
const ready = { status: 200, body: { data: replayChunk() } };
const notReady = fail(404, 'replay_not_ready');
const replayCalls = (calls: { path: string }[]) =>
  calls.filter((call) => call.path === '/contests/r41/replay').length;

function mountProbe() {
  let state = (): string => 'none';
  const wrapper = mountComponent(
    defineComponent({
      setup() {
        const query = useReplayQuery(ref('r41'), ref(true));
        state = () => query.data.value?.state ?? String(query.status.value);
        return () => h('div');
      },
    }),
  );
  return { wrapper, state: () => state() };
}

describe('useReplayQuery', () => {
  afterEach(() => vi.useRealTimers());

  it('polls every 5 s while the replay is building and stops once it is ready', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({
      'GET /auth/me': signedOut,
      [ROUTE]: sequence(building, building, ready),
    });
    const probe = mountProbe();
    await flushPromises();
    expect(probe.state()).toBe('building');
    vi.advanceTimersByTime(REPLAY_POLL_MS);
    await flushPromises();
    expect(replayCalls(calls)).toBe(2);
    vi.advanceTimersByTime(REPLAY_POLL_MS);
    await flushPromises();
    expect(probe.state()).toBe('ready');
    vi.advanceTimersByTime(REPLAY_POLL_MS * 4);
    await flushPromises();
    expect(replayCalls(calls)).toBe(3);
  });

  it('stops polling when the page goes away', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({ 'GET /auth/me': signedOut, [ROUTE]: building });
    const probe = mountProbe();
    await flushPromises();
    probe.wrapper.unmount();
    vi.advanceTimersByTime(REPLAY_POLL_MS * 4);
    await flushPromises();
    expect(replayCalls(calls)).toBe(1);
  });

  it('never retries a refusal of the gate', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({ 'GET /auth/me': signedOut, [ROUTE]: fail(403, 'forbidden') });
    const probe = mountProbe();
    vi.advanceTimersByTime(10_000);
    await flushPromises();
    expect(probe.state()).toBe('error');
    expect(replayCalls(calls)).toBe(1);
  });

  it("asks again for another viewer instead of showing the first viewer's replay", async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({ 'GET /auth/me': signedOut, [ROUTE]: ready });
    mountProbe();
    await flushPromises();
    useSessionStore().user = sessionUser({ id: 'user-b' });
    await flushPromises();
    expect(replayCalls(calls)).toBe(2);
  });

  it('asks again after replay_not_ready with a growing wait and shows the board once it is ready', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({
      'GET /auth/me': signedOut,
      [ROUTE]: sequence(notReady, notReady, notReady, ready),
    });
    const probe = mountProbe();
    await flushPromises();
    const after = async (ms: number) => {
      vi.advanceTimersByTime(ms);
      await flushPromises();
      return replayCalls(calls);
    };
    expect(await after(REPLAY_POLL_MS)).toBe(2);
    expect(await after(2 * REPLAY_POLL_MS - 1)).toBe(2);
    expect(await after(1)).toBe(3);
    expect(await after(4 * REPLAY_POLL_MS)).toBe(4);
    expect(probe.state()).toBe('ready');
    expect(await after(NOT_READY_MAX_POLL_MS * 2)).toBe(4);
  });

  it('doubles the not-ready wait up to a minute', () => {
    expect([1, 2, 3, 4, 5, 9].map(notReadyPollMs)).toEqual([
      5000, 10_000, 20_000, 40_000, 60_000, 60_000,
    ]);
  });

  it('stops polling when a building replay is refused on a later read', async () => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    const calls = mockApi({
      'GET /auth/me': signedOut,
      [ROUTE]: sequence(building, fail(403, 'forbidden'), building),
    });
    mountProbe();
    await flushPromises();
    vi.advanceTimersByTime(REPLAY_POLL_MS);
    await flushPromises();
    expect(replayCalls(calls)).toBe(2);
    vi.advanceTimersByTime(REPLAY_POLL_MS * 6);
    await flushPromises();
    expect(replayCalls(calls)).toBe(2);
  });
});
