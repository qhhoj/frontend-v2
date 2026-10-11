import { flushPromises } from '@vue/test-utils';
import { effectScope, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import { AVAILABILITY_DELAY_MS, useUsernameAvailability } from './use-username-availability';

const ROUTE = 'GET /auth/username-available';
const takenNames = ['busy_name'];
const answerByName = (call: { query: URLSearchParams }) =>
  ok({ available: !takenNames.includes(call.query.get('username') ?? '') });

function setup(initial: string) {
  const username = ref(initial);
  const scope = effectScope();
  const { status } = scope.run(() => useUsernameAvailability(username))!;
  return { username, status, scope };
}
/** Types `text`, lets the pause elapse and the answer arrive. Only `setTimeout` is faked: reading a response needs the real event loop. */
const typeAndWait = async (username: { value: string }, text: string) => {
  username.value = text;
  await nextTick();
  await vi.advanceTimersByTimeAsync(AVAILABILITY_DELAY_MS);
  await flushPromises();
};

describe('useUsernameAvailability', () => {
  beforeEach(() => void vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }));
  afterEach(() => void vi.useRealTimers());

  it('asks once after the viewer pauses, not on every keystroke, and for the text as it is then', async () => {
    const calls = mockApi({ [ROUTE]: answerByName });
    const { username } = setup('');
    for (const text of ['n', 'ne', 'new']) {
      username.value = text;
      await nextTick();
      await vi.advanceTimersByTimeAsync(AVAILABILITY_DELAY_MS - 1);
    }
    expect(calls).toHaveLength(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls.map((call) => call.query.get('username'))).toEqual(['new']);
  });

  it('says available only for the confirmed text, and stops saying it as soon as the text changes', async () => {
    mockApi({ [ROUTE]: answerByName });
    const { username, status } = setup('');
    await typeAndWait(username, 'free_name');
    expect(status.value).toBe('available');
    username.value = 'free_name2';
    await nextTick();
    expect(status.value).toBe('checking');
  });

  it.each(['', 'bad name', 'a-b', 'x'.repeat(31)])(
    'does not ask for %j, which registration would refuse anyway, and stays idle',
    async (text) => {
      const calls = mockApi({ [ROUTE]: answerByName });
      const { username, status } = setup('seed'); // 'seed' would be asked after the pause, unless the new text cancels it
      await typeAndWait(username, text);
      expect(calls).toHaveLength(0);
      expect(status.value).toBe('idle');
    },
  );

  it('ignores the late answer for an earlier text', async () => {
    const waiting: Array<(available: boolean) => void> = [];
    vi.stubGlobal(
      'fetch',
      () =>
        new Promise<Response>((resolve) =>
          waiting.push((available) =>
            resolve(
              new Response(JSON.stringify({ data: { available } }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
              }),
            ),
          ),
        ),
    );
    const { username, status } = setup('');
    await typeAndWait(username, 'first_name');
    await typeAndWait(username, 'second_name');
    expect(waiting).toHaveLength(2);
    waiting[1]!(false); // the newer question is answered first: taken
    await flushPromises();
    waiting[0]!(true); // the older one arrives late: it must not turn the tick on
    await flushPromises();
    expect(status.value).toBe('taken');
  });

  it('aborts the request in flight when the text changes', async () => {
    const signals: AbortSignal[] = [];
    vi.stubGlobal('fetch', (_url: string, init: RequestInit) => {
      signals.push(init.signal!);
      return new Promise<Response>(() => {});
    });
    const { username } = setup('');
    await typeAndWait(username, 'first_name');
    username.value = 'second_name';
    await nextTick();
    expect(signals[0]!.aborted).toBe(true);
  });

  it('shows nothing after a 429 and stops asking for the rest of the visit', async () => {
    const calls = mockApi({ [ROUTE]: fail(429, 'rate_limited') });
    const { username, status } = setup('');
    await typeAndWait(username, 'one_name');
    expect(status.value).toBe('idle');
    await typeAndWait(username, 'two_name');
    expect(calls).toHaveLength(1);
    expect(status.value).toBe('idle');
  });

  it('shows nothing after another failure but asks again for the next name', async () => {
    let attempts = 0;
    const calls = mockApi({
      [ROUTE]: () => (++attempts === 1 ? fail(500, 'internal_error') : ok({ available: true })),
    });
    const { username, status } = setup('');
    await typeAndWait(username, 'one_name');
    expect(status.value).toBe('idle');
    await typeAndWait(username, 'two_name');
    expect(calls).toHaveLength(2);
    expect(status.value).toBe('available');
  });

  it('does not ask twice for a name it already has the answer to', async () => {
    const calls = mockApi({ [ROUTE]: answerByName });
    const { username, status } = setup('');
    await typeAndWait(username, 'free_name');
    await typeAndWait(username, 'free_name2');
    username.value = 'free_name';
    await nextTick();
    expect(status.value).toBe('available');
    await vi.advanceTimersByTimeAsync(AVAILABILITY_DELAY_MS);
    await flushPromises();
    expect(calls.map((call) => call.query.get('username'))).toEqual(['free_name', 'free_name2']);
  });

  it('sends nothing once its scope is gone', async () => {
    const calls = mockApi({ [ROUTE]: answerByName });
    const { username, scope } = setup('');
    username.value = 'free_name';
    await nextTick();
    scope.stop();
    await vi.advanceTimersByTimeAsync(AVAILABILITY_DELAY_MS);
    expect(calls).toHaveLength(0);
  });
});
