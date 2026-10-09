import { useQueryClient } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed, onBeforeUnmount, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { ApiError } from '@/api/client';
import { createShortLink } from '@/api/short-links.api';
import type { ShortLink } from '@/api/types/short-links';
import { COPIED_FEEDBACK_MS, copyText } from '@/lib/clipboard';
import { useViewerId } from '@/stores/use-viewer-id';
import { shortLinkUrl } from './short-link-path';

export type ShortLinkState = 'idle' | 'creating' | 'copied' | 'limited' | 'manual' | 'failed';
const isRateLimited = (error: unknown) => error instanceof ApiError && error.status === 429;

/** The code kept for this viewer and path, else a new link (cached for the next click). */
async function cachedOrNewCode(
  queryClient: QueryClient,
  key: readonly unknown[],
  path: string,
): Promise<string> {
  const cached = queryClient.getQueryData<ShortLink>(key);
  if (cached) return cached.code;
  const link = await createShortLink({ path });
  queryClient.setQueryData(key, link);
  return link.code;
}

/** Copies the automatic short link of `path`; the code is kept per viewer and path, so a second click sends nothing. */
export function useShortLink(path: MaybeRefOrGetter<string>) {
  const queryClient = useQueryClient();
  const viewerId = useViewerId();
  const state = ref<ShortLinkState>('idle');
  const url = ref<string | null>(null);
  const failure = ref<unknown>(null);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;
  const cacheKey = computed(() => ['shortLinks', 'auto', viewerId.value, toValue(path)] as const);

  function showCopied() {
    state.value = 'copied';
    clearTimeout(resetTimer);
    resetTimer = setTimeout(() => (state.value = 'idle'), COPIED_FEEDBACK_MS);
  }

  /** One request at a time (a double click sends one), none once the daily limit answered. */
  async function copy() {
    if (state.value === 'creating' || state.value === 'limited') return;
    state.value = 'creating';
    try {
      url.value = shortLinkUrl(await cachedOrNewCode(queryClient, cacheKey.value, toValue(path)));
    } catch (error) {
      failure.value = error;
      state.value = isRateLimited(error) ? 'limited' : 'failed';
      return;
    }
    if (await copyText(url.value)) showCopied();
    else state.value = 'manual';
  }

  onBeforeUnmount(() => clearTimeout(resetTimer));
  return { state, url, failure, copy };
}
