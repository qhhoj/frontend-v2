import type { QueryClient } from '@tanstack/vue-query';

/** Puts a cache entry under each key, as a page that was read earlier would have. */
export function seedCache(queryClient: QueryClient, keys: readonly (readonly unknown[])[]) {
  keys.forEach((key) => queryClient.setQueryData(key, { seeded: true }));
}

/** The seeded keys a write has marked stale (the next read of them fetches again). */
export const invalidatedKeys = (queryClient: QueryClient, keys: readonly (readonly unknown[])[]) =>
  keys.filter((key) => queryClient.getQueryState(key)?.isInvalidated);
