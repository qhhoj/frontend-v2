import { onScopeDispose, watch, computed } from 'vue';
import type { Ref } from 'vue';
import { useSubmissionStatus } from '@/api/use-submission-status';
import type { SubmissionStatus } from '@/api/types/submissions';
import { useSubmissionQuery } from './submissions.queries';

/** Statuses of a row that is still being judged. `PD` (final-only contest) emits no events, so it is not here. */
export const IN_PROGRESS_STATUSES: readonly SubmissionStatus[] = ['QU', 'P', 'G'];
/** Test-case events come in bursts; the row is read once after the burst. */
const ROW_REFETCH_DEBOUNCE_MS = 400;

/**
 * The submission row kept up to date while it is judged. The stream is followed only while the stored row is
 * in progress. `useSubmissionStatus` reads the row once more when the stream ends (it invalidates `['submissions']`),
 * so that final read is not repeated here.
 */
export function useLiveSubmission(id: Ref<string>) {
  const submission = useSubmissionQuery(id);
  const followedId = computed(() => {
    const status = submission.data.value?.status;
    return status && IN_PROGRESS_STATUSES.includes(status) ? id.value : null;
  });
  const live = useSubmissionStatus(followedId);
  const isLive = computed(() => followedId.value !== null && !live.done && !live.stale);

  let refetchTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelRefetch = () => clearTimeout(refetchTimer);
  watch(
    () => live.currentTestcase,
    (testcase) => {
      // 0 is the `done` event (the final read follows by itself); the row already shows the testcase the state frame reports.
      if (!isLive.value || testcase === 0 || testcase === submission.data.value?.currentTestcase)
        return;
      cancelRefetch();
      refetchTimer = setTimeout(() => void submission.refetch(), ROW_REFETCH_DEBOUNCE_MS);
    },
  );
  watch(isLive, (stillLive) => stillLive || cancelRefetch());
  onScopeDispose(cancelRefetch);

  return { submission, live, isLive };
}
