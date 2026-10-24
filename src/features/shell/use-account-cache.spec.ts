import { useQueryClient } from '@tanstack/vue-query';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import type { VNode } from 'vue';
import { NO_FILTERS } from '@/features/problems/use-problem-filters';
import { useProblemListQuery } from '@/features/problems/problems.queries';
import { sessionUser, signedOut } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';
import { useAccountCacheSync } from './use-account-cache';

const CACHED_KEY = ['problems', 'list', { page: 1 }];
const accountA = sessionUser({ id: '0192a000-0000-7000-8000-00000000000a', username: 'user_a' });
const accountB = sessionUser({ id: '0192a000-0000-7000-8000-00000000000b', username: 'user_b' });

/** Mounts the sync in the shell's place, beside what `page` renders (nothing by default). */
const mountWithSync = (page: () => () => VNode | null = () => () => null) =>
  mountComponent(
    defineComponent({
      setup() {
        useAccountCacheSync();
        return page();
      },
    }),
  );

/** Mounts the sync with a cached entry, as a page that was already open would leave it. */
function mountSync() {
  let queryClient!: ReturnType<typeof useQueryClient>;
  mountWithSync(() => {
    queryClient = useQueryClient();
    return () => null;
  });
  queryClient.setQueryData(CACHED_KEY, { rows: ['seen by the previous viewer'] });
  return {
    session: useSessionStore(),
    isCached: () => queryClient.getQueryData(CACHED_KEY) !== undefined,
  };
}

describe('account cache sync', () => {
  it('drops the cache when another account takes over the session', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'authenticated', user: accountA });
    await flushPromises();
    session.$patch({ user: accountB });
    await flushPromises();
    expect(isCached()).toBe(false);
  });

  it('drops the cache when an anonymous visitor signs in', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'anonymous', user: null });
    await flushPromises();
    session.$patch({ status: 'authenticated', user: accountA });
    await flushPromises();
    expect(isCached()).toBe(false);
  });

  it('drops the cache on sign-out or expiry', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'authenticated', user: accountA });
    await flushPromises();
    session.$patch({ status: 'anonymous', user: null });
    await flushPromises();
    expect(isCached()).toBe(false);
  });

  it('shows a mounted problem list as the new viewer sees it', async () => {
    const viewer = sessionUser({ id: '0192a000-0000-7000-8000-00000000000c' });
    // The server answers with the solved mark of whoever the session belongs to at that moment.
    mockApi({
      'GET /auth/me': signedOut,
      'GET /problems': () =>
        page([{ code: 'aplusb', viewerStatus: useSessionStore().user?.id ?? 'anonymous' }]),
    });
    const wrapper = mountWithSync(() => {
      const { data } = useProblemListQuery(ref(NO_FILTERS), ref('vi'), ref(1));
      return () => h('p', data.value?.items[0]?.viewerStatus ?? '');
    });
    const session = useSessionStore();
    await flushPromises();
    session.$patch({ status: 'authenticated', user: viewer });
    await flushPromises();
    expect(wrapper.text()).toBe(viewer.id);
    session.$patch({ status: 'anonymous', user: null });
    await flushPromises();
    expect(wrapper.text()).toBe('anonymous');
  });
});
