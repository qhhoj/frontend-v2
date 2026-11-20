import { ref } from 'vue';
import type { NumberedComment } from './comment-order';
import type { useCommentWrites } from './comments.queries';

/**
 * The moderation and delete actions of one comment page: hide a comment (with its replies) behind a confirm, unhide it,
 * lock or unlock the page, delete behind a confirm (the author, or a moderator). `pageLocked` is null while the page loads.
 */
export function useCommentModeration(
  writes: ReturnType<typeof useCommentWrites>,
  pageLocked: () => boolean | null,
) {
  const hideTarget = ref<NumberedComment | null>(null);
  const isHideOpen = ref(false);
  const hideFailed = ref(false);
  function askHide(entry: NumberedComment) {
    hideTarget.value = entry;
    hideFailed.value = false;
    isHideOpen.value = true;
  }
  async function confirmHide() {
    if (!hideTarget.value) return;
    try {
      await writes.hide.mutateAsync(hideTarget.value.comment.id);
      isHideOpen.value = false;
    } catch {
      hideFailed.value = true;
    }
  }
  const lockFailed = ref(false);
  async function toggleLock() {
    const isLocked = pageLocked();
    if (isLocked === null) return;
    lockFailed.value = false;
    try {
      await writes.setLocked.mutateAsync(!isLocked);
    } catch {
      lockFailed.value = true;
    }
  }

  const unhideFailedId = ref<string | null>(null);
  async function unhide(entry: NumberedComment) {
    unhideFailedId.value = null;
    try {
      await writes.unhide.mutateAsync(entry.comment.id);
    } catch {
      unhideFailedId.value = entry.comment.id;
    }
  }

  const deleteTarget = ref<NumberedComment | null>(null);
  const isDeleteOpen = ref(false);
  const deleteFailed = ref(false);
  function askDelete(entry: NumberedComment) {
    deleteTarget.value = entry;
    deleteFailed.value = false;
    isDeleteOpen.value = true;
  }
  async function confirmDelete() {
    if (!deleteTarget.value) return;
    try {
      await writes.remove.mutateAsync(deleteTarget.value.comment.id);
      isDeleteOpen.value = false;
    } catch {
      deleteFailed.value = true;
    }
  }

  return {
    hideTarget,
    isHideOpen,
    hideFailed,
    askHide,
    confirmHide,
    lockFailed,
    toggleLock,
    unhideFailedId,
    unhide,
    deleteTarget,
    isDeleteOpen,
    deleteFailed,
    askDelete,
    confirmDelete,
  };
}
