import { ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { hidePost, showPost } from '@/api/blog-admin.api';
import type { PostListItem } from '@/api/types/blog';
import { useAdminMutation } from '../ui/use-admin-mutation';

/**
 * Hiding and showing one post: one write at a time, and a post that changes side leaves the public lists and both
 * moderation queues stale.
 */
export function usePostVisibility() {
  const queryClient = useQueryClient();
  const pendingId = ref<string | null>(null);
  const mutation = useAdminMutation({
    mutate: ({ post, visible }: { post: PostListItem; visible: boolean }) =>
      (visible ? showPost : hidePost)(post.id),
    invalidates: () => [['admin', 'posts']],
    onDone: () => void queryClient.invalidateQueries({ queryKey: ['posts'] }),
  });

  async function change(post: PostListItem, visible: boolean) {
    if (pendingId.value !== null) return undefined;
    pendingId.value = post.id;
    try {
      return await mutation.run({ post, visible });
    } finally {
      pendingId.value = null;
    }
  }

  return {
    hide: (post: PostListItem) => change(post, false),
    show: (post: PostListItem) => change(post, true),
    pendingId,
    failure: mutation.failure,
    reset: mutation.reset,
  };
}
