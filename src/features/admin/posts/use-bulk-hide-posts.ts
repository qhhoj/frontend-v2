import { ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { ApiError } from '@/api/client';
import { patchPostFlag } from '@/api/blog-admin.api';

export interface BulkHideOutcome {
  done: number;
  refused: number;
}

/** Hides the posts one after another (a hide is a `visible: false` edit, which skips the write limit for `edit_all_post`); a refused one never stops the rest. */
export function useBulkHidePosts() {
  const queryClient = useQueryClient();
  const isPending = ref(false);

  async function run(ids: readonly string[]): Promise<BulkHideOutcome | undefined> {
    if (isPending.value) return undefined;
    isPending.value = true;
    let refused = 0;
    try {
      for (const id of ids) {
        try {
          await patchPostFlag(id, { visible: false });
        } catch (error) {
          if (!(error instanceof ApiError)) throw error;
          refused += 1;
        }
      }
    } finally {
      isPending.value = false;
      void queryClient.invalidateQueries({ queryKey: ['admin', 'posts'] });
      void queryClient.invalidateQueries({ queryKey: ['posts'] });
    }
    return { done: ids.length - refused, refused };
  }

  return { run, isPending };
}
