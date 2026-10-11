import { ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { patchPostFlag } from '@/api/blog-admin.api';
import type { PostFlagPatch } from '@/api/blog-admin.api';
import type { PostListItem } from '@/api/types/blog';
import type { PostFlags } from './moderation';
import { useAdminMutation } from '../ui/use-admin-mutation';

/**
 * One flag of one post (shown, pinned, global): one write at a time, and a post that changes leaves the public lists and
 * the moderation queues stale.
 */
export function usePostVisibility() {
  const queryClient = useQueryClient();
  const pendingId = ref<string | null>(null);
  const mutation = useAdminMutation({
    mutate: ({ post, patch }: { post: PostListItem; patch: PostFlagPatch }) =>
      patchPostFlag(post.id, patch),
    invalidates: () => [['admin', 'posts']],
    onDone: () => void queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  async function change(post: PostListItem, patch: PostFlagPatch) {
    if (pendingId.value !== null) return undefined;
    pendingId.value = post.id;
    try {
      return await mutation.run({ post, patch });
    } finally {
      pendingId.value = null;
    }
  }

  return {
    hide: (post: PostListItem) => change(post, { visible: false }),
    show: (post: PostListItem) => change(post, { visible: true }),
    /** Pin or unpin, or put on or take off the home newsfeed. */
    flag: (post: PostListItem, patch: PostFlags) => change(post, patch),
    pendingId,
    failure: mutation.failure,
    reset: mutation.reset,
  };
}
