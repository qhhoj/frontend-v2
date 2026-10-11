import { flushPromises } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { useSessionStore } from '@/stores/session.store';
import { contestItem, ranking, sessionUser } from '@/test/fixtures';
import { page } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useContestListQuery, useRankingQuery } from './contests.queries';

const json = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
const signedInAs = (id: string) => sessionUser({ id });
const never = () => new Promise<Response>(() => {});
const currentViewer = () => useSessionStore().user?.id ?? 'anonymous';
/** The session load runs on mount; it answers signed out, the way the page specs do. */
const signedOutSession = () =>
  Promise.resolve(
    new Response(JSON.stringify({ error: { code: 'unauthorized', message: 'Unauthorized' } }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    }),
  );

/** Runs `query` inside a mounted probe and returns its result once the session load it starts has settled. */
async function probe<T>(query: () => T): Promise<T> {
  let result!: T;
  mountComponent(
    defineComponent({
      setup() {
        result = query();
        return () => h('div');
      },
    }),
  );
  await flushPromises();
  return result;
}

describe('contest queries across a session change', () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows none of viewer A's list while viewer B's list loads", async () => {
    let answerB!: (response: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input.includes('/auth/me')) return signedOutSession();
        const viewer = currentViewer();
        if (viewer === 'user-a')
          return Promise.resolve(json(page([contestItem({ name: 'Contest of A' })]).body));
        if (viewer === 'user-b') return new Promise<Response>((resolve) => (answerB = resolve));
        return never();
      }),
    );
    const list = await probe(() => useContestListQuery(ref({})));
    const session = useSessionStore();
    session.user = signedInAs('user-a');
    await flushPromises();
    expect(list.data.value?.items[0]?.name).toBe('Contest of A');

    session.user = signedInAs('user-b');
    await flushPromises();
    expect(list.data.value).toBeUndefined();
    expect(list.isPlaceholderData.value).toBe(false);

    answerB(json(page([contestItem({ name: 'Contest of B' })]).body));
    await flushPromises();
    expect(list.data.value?.items[0]?.name).toBe('Contest of B');
  });

  it('keeps the board on a virtual toggle for the same viewer, and drops it across viewers', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((input: string) => {
        if (input.includes('/auth/me')) return signedOutSession();
        const isVirtual = new URL(input, 'http://localhost').searchParams.get('virtual') === 'true';
        return currentViewer() === 'user-a' && !isVirtual
          ? Promise.resolve(json({ data: ranking() }))
          : never();
      }),
    );
    const withVirtual = ref(false);
    const board = await probe(() => useRankingQuery(ref('r42'), withVirtual, ref(false)));
    const session = useSessionStore();
    session.user = signedInAs('user-a');
    await flushPromises();
    expect(board.data.value).toEqual(ranking());

    withVirtual.value = true;
    await flushPromises();
    expect(board.data.value).toEqual(ranking());
    expect(board.isPlaceholderData.value).toBe(true);

    session.user = signedInAs('user-b');
    await flushPromises();
    expect(board.data.value).toBeUndefined();
  });
});
