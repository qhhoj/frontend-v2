import { computed, nextTick, onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useSubmissionStatus } from '@/api/use-submission-status';
import { IN_PROGRESS_STATUSES } from '@/api/types/submissions';
import { useSubmissionQuery } from './submissions.queries';

/** Test-case events come in bursts; the row is read once after the burst. */
const ROW_REFETCH_DEBOUNCE_MS = 400;
/** A judge faster than the debounce would otherwise never let the rows move until the end. */
const ROW_REFETCH_MAX_WAIT_MS = 2000;

/**
 * The submission row kept up to date while it is judged. The stream is followed only while the stored row is
 * in progress. `useSubmissionStatus` reads the row once more when the stream ends (it invalidates the list, detail and stats),
 * so that final read is not repeated here.
 */
export function useLiveSubmission(id: Ref<string>) {
  const submission = useSubmissionQuery(id);
  /** Set for one tick by `refollow`: a followed id that stays the same would not reopen the stream. */
  const isPausedForRefollow = ref(false);
  const followedId = computed(() => {
    const status = submission.data.value?.status;
    const inProgress = status !== undefined && IN_PROGRESS_STATUSES.includes(status);
    return inProgress && !isPausedForRefollow.value ? id.value : null;
  });
  const live = useSubmissionStatus(followedId);
  const isLive = computed(() => followedId.value !== null && !live.done && !live.stale);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  let maxWaitTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelRefetch = () => {
    clearTimeout(debounceTimer);
    clearTimeout(maxWaitTimer);
    maxWaitTimer = undefined;
  };
  const refetchNow = () => {
    cancelRefetch();
    void submission.refetch();
  };
  watch(
    () => live.currentTestcase,
    (testcase) => {
      // 0 is the `done` event: the final read follows by itself.
      if (testcase === 0) return cancelRefetch();
      if (!isLive.value || testcase === submission.data.value?.currentTestcase) return;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(refetchNow, ROW_REFETCH_DEBOUNCE_MS);
      maxWaitTimer ??= setTimeout(refetchNow, ROW_REFETCH_MAX_WAIT_MS);
    },
  );
  watch(isLive, (stillLive) => {
    if (!stillLive) cancelRefetch();
  });
  onScopeDispose(cancelRefetch);

  /** After the stream was lost: read the row and, if it is still in progress, follow it again. */
  async function refollow() {
    isPausedForRefollow.value = true;
    await nextTick();
    isPausedForRefollow.value = false;
    await submission.refetch();
  }

  return { submission, live, isLive, refollow };
}
