import { useQueryClient } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { reactive, readonly, watch } from 'vue';
import type { Ref } from 'vue';
import { useLiveStream } from './events';
import { fetchSubmission } from './submissions.api';
import { FINISHED_STATUSES } from './types/submissions';
import type {
  SubmissionProgressEvent,
  SubmissionResult,
  SubmissionStateEvent,
  SubmissionStatus,
} from './types/submissions';

export interface SubmissionLiveState {
  status: SubmissionStatus | null;
  result: SubmissionResult | null;
  currentTestcase: number;
  done: boolean;
  /** The stream closed for good and the final row could not be confirmed: the shown status may be outdated, ask the user to reload. */
  stale: boolean;
}

type StoredRow = { status: SubmissionStatus; result: SubmissionResult | null };

/** What a finished grading changes: the list, detail and stats. The source (up to 64 KB) never changes, so it is not refetched. */
const SUBMISSION_SCOPES_TO_REFRESH: unknown[] = ['list', 'detail', 'stats'];
const changesWithGrading = (queryKey: readonly unknown[]) =>
  queryKey[0] === 'submissions' && SUBMISSION_SCOPES_TO_REFRESH.includes(queryKey[1]);
const refreshGraded = (queryClient: QueryClient) =>
  void queryClient.invalidateQueries({ predicate: ({ queryKey }) => changesWithGrading(queryKey) });
const PROGRESS_EVENTS = ['queued', 'processing', 'grading-begin', 'test-case', 'done'] as const;

const idle = (): SubmissionLiveState => ({
  status: null,
  result: null,
  currentTestcase: 0,
  done: false,
  stale: false,
});

interface FollowHooks {
  /** Closes the stream: the stored row is read or the stream is given up. */
  endStream: () => void;
  /** False once the followed id changed, so a late answer is dropped even when the id is back. */
  isCurrent: () => boolean;
  onFinished: () => void;
}

/** What the frames of one followed submission do to `state`. */
function followSubmission(id: string, state: SubmissionLiveState, hooks: FollowHooks) {
  /** Set once the stored row is read or the stream is given up, so a late frame does not finish twice. */
  let isOver = false;
  /** Reads the stored row once and ends the stream; `known` is a row already fetched. */
  async function finish(known?: StoredRow) {
    isOver = true;
    hooks.endStream();
    const row = known ?? (await fetchSubmission(id).catch(() => null));
    if (!hooks.isCurrent()) return;
    if (row) Object.assign(state, { status: row.status, result: row.result });
    state.done = true;
    hooks.onFinished();
  }
  /** The stored row is the truth when events were lost (`resync`) or the stream is gone. A gone stream whose final row cannot be confirmed leaves the state `stale`. */
  async function rereadRow(streamIsDead: boolean) {
    const row = await fetchSubmission(id).catch(() => null);
    if (!hooks.isCurrent() || isOver) return;
    if (row) {
      Object.assign(state, { status: row.status, currentTestcase: row.currentTestcase ?? 0 });
      if (FINISHED_STATUSES.includes(row.status)) return void finish(row);
    }
    if (!streamIsDead) return;
    isOver = true;
    hooks.endStream();
    state.stale = true;
  }
  function apply(event: SubmissionProgressEvent | SubmissionStateEvent) {
    if (isOver || typeof event.status !== 'string') return;
    Object.assign(state, { status: event.status, currentTestcase: event.currentTestcase ?? 0 });
    if (FINISHED_STATUSES.includes(event.status)) void finish();
  }
  return { apply, rereadRow };
}

/**
 * Follows one submission over SSE; once finished it reads the stored row (result and points live in REST) and refreshes the list, detail and stats.
 * `viewer` is the account the tab is signed in as: another one reopens the stream, which the server authorised for the previous one.
 */
export function useSubmissionStatus(
  submissionId: Ref<string | null>,
  viewer: Ref<string>,
): Readonly<SubmissionLiveState> {
  const queryClient = useQueryClient();
  const state = reactive<SubmissionLiveState>(idle());
  let generation = 0;
  let followed: ReturnType<typeof followSubmission> | null = null;
  watch(
    submissionId,
    (id) => {
      Object.assign(state, idle());
      generation += 1;
      const mine = generation;
      const hooks = {
        endStream: () => live.close(),
        isCurrent: () => generation === mine,
        onFinished: () => refreshGraded(queryClient),
      };
      followed = id ? followSubmission(id, state, hooks) : null;
    },
    { immediate: true },
  );
  const apply = (event: SubmissionProgressEvent | SubmissionStateEvent) => followed?.apply(event);
  const target = () =>
    submissionId.value
      ? {
          route: '/events/submissions/{id}' as const,
          params: { id: submissionId.value },
          viewer: viewer.value,
        }
      : null;
  const live = useLiveStream(target, {
    frames: {
      ...Object.fromEntries(PROGRESS_EVENTS.map((name) => [name, apply])),
      state: apply,
      resync: () => void followed?.rereadRow(false),
    },
    onGiveUp: () => void followed?.rereadRow(true),
  });
  return readonly(state);
}
