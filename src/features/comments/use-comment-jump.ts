import { nextTick, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { locateComment } from '@/api/comments.api';
import type { CommentPageType } from '@/api/types/comments';
import { commentIdFromHash, pageToOpen } from './comment-jump';

/**
 * A `#comment-<id>` link scrolls once the list holding it has rendered (the router's own scroll runs before the fetch ends).
 * A comment that is not on the page shown is located once; when it sits on another listing page of this commented page, that
 * page opens (`pageQuery`) with the same hash, which scrolls on arrival.
 */
export function useCommentJump(options: {
  type: () => CommentPageType;
  pageKey: () => string;
  pageNumber: () => number;
  pageQuery: string;
  shownIds: () => ReadonlySet<string> | null;
}) {
  const route = useRoute();
  const router = useRouter();
  const located = new Set<string>();

  async function openPageOf(id: string) {
    if (located.has(id)) return;
    located.add(id);
    const location = await locateComment(id).catch(() => null);
    const page =
      location &&
      pageToOpen(location, {
        type: options.type(),
        key: options.pageKey(),
        page: options.pageNumber(),
      });
    if (page === null || page === undefined) return;
    await router.replace({
      query: { ...route.query, [options.pageQuery]: page === 1 ? undefined : String(page) },
      hash: route.hash,
    });
  }

  watch(
    () => [options.shownIds(), route.hash] as const,
    async ([shown, hash]) => {
      const id = commentIdFromHash(hash);
      if (!shown || !id) return;
      if (!shown.has(id)) return openPageOf(id);
      await nextTick();
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
    },
    { immediate: true },
  );
}
