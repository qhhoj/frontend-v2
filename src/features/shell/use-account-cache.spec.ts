import { useQueryClient } from '@tanstack/vue-query';
import { describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { sessionUser } from '@/test/fixtures';
import { mountComponent } from '@/test/mount';
import { useSessionStore } from '@/stores/session.store';
import { useAccountCacheSync } from './use-account-cache';

const CACHED_KEY = ['problems', 'list', { page: 1 }];
const accountA = sessionUser({ id: '0192a000-0000-7000-8000-00000000000a', username: 'user_a' });
const accountB = sessionUser({ id: '0192a000-0000-7000-8000-00000000000b', username: 'user_b' });

/** Mounts the sync with a cached entry, as a page that was already open would leave it. */
function mountSync() {
  let queryClient!: ReturnType<typeof useQueryClient>;
  mountComponent(
    defineComponent({
      setup() {
        queryClient = useQueryClient();
        useAccountCacheSync();
        return () => null;
      },
    }),
  );
  queryClient.setQueryData(CACHED_KEY, { rows: ['seen by the previous viewer'] });
  return {
    session: useSessionStore(),
    isCached: () => queryClient.getQueryData(CACHED_KEY) !== undefined,
  };
}

describe('account cache sync', () => {
  it('keeps the cache when the first /auth/me answer arrives', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'authenticated', user: accountA });
    await Promise.resolve();
    expect(isCached()).toBe(true);
  });

  it('keeps the cache of an anonymous visitor who stays anonymous', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'anonymous', user: null });
    await Promise.resolve();
    expect(isCached()).toBe(true);
  });

  it('drops the cache when another account takes over the session', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'authenticated', user: accountA });
    await Promise.resolve();
    session.$patch({ user: accountB });
    await Promise.resolve();
    expect(isCached()).toBe(false);
  });

  it('drops the cache when an anonymous visitor signs in', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'anonymous', user: null });
    await Promise.resolve();
    session.$patch({ status: 'authenticated', user: accountA });
    await Promise.resolve();
    expect(isCached()).toBe(false);
  });

  it('drops the cache on sign-out or expiry', async () => {
    const { session, isCached } = mountSync();
    session.$patch({ status: 'authenticated', user: accountA });
    await Promise.resolve();
    session.$patch({ status: 'anonymous', user: null });
    await Promise.resolve();
    expect(isCached()).toBe(false);
  });
});
