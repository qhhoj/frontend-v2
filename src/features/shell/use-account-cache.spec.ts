import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { flushPromises } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import type { VNode } from 'vue';
import { NO_FILTERS } from '@/features/problems/use-problem-filters';
import { useProblemListQuery } from '@/features/problems/problems.queries';
import { sessionUser, signedOut } from '@/test/fixtures';
import { mockApi, page } from '@/test/mock-api';
import { mountComponent } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { readStorage, writeStorage } from '@/lib/storage';
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

  it('drops the cache and the admin recent screens on sign-out or expiry', async () => {
    const { session, isCached } = mountSync();
    const recentKey = `qhhoj.admin.recent.${accountA.id}`;
    writeStorage(recentKey, '[{"path":"/admin/users","titleKey":"t","detail":null}]');
    session.$patch({ status: 'authenticated', user: accountA });
    await flushPromises();
    session.$patch({ status: 'anonymous', user: null });
    await flushPromises();
    expect(isCached()).toBe(false);
    expect(readStorage(recentKey)).toBeNull();
  });

  it('drops the stored recent screens when the session resolves to anonymous at boot', async () => {
    mountSync();
    const recentKey = 'qhhoj.admin.recent.0192a000-0000-7000-8000-0000000000ff';
    writeStorage(recentKey, '[]');
    useSessionStore().$patch({ status: 'anonymous', user: null });
    await flushPromises();
    expect(readStorage(recentKey)).toBeNull();
  });

  it('reads a mounted viewer-keyed query once for the new viewer, not twice', async () => {
    const viewer = sessionUser({ id: '0192a000-0000-7000-8000-00000000000d' });
    mockApi({ 'GET /auth/me': signedOut });
    const reads: string[] = [];
    mountWithSync(() => {
      const viewerId = useViewerId();
      useQuery({
        queryKey: computed(() => ['probe', viewerId.value]),
        queryFn: () => reads.push(viewerId.value),
      });
      return () => null;
    });
    await flushPromises();
    useSessionStore().$patch({ status: 'authenticated', user: viewer });
    await flushPromises();
    expect(reads).toEqual(['anonymous', viewer.id]);
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
