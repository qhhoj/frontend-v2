import { useQueryClient } from '@tanstack/vue-query';
import { onScopeDispose, reactive, readonly, watch } from 'vue';
import type { Ref } from 'vue';
import { openEventStream } from './events';
import type { EventStream } from './events';
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
}

const PROGRESS_EVENTS = ['queued', 'processing', 'grading-begin', 'test-case', 'done'] as const;

/** Follows one submission over SSE; once finished it reads the stored row (result and points live in REST) and refreshes submission lists. */
export function useSubmissionStatus(
  submissionId: Ref<string | null>,
): Readonly<SubmissionLiveState> {
  const queryClient = useQueryClient();
  const state = reactive<SubmissionLiveState>({
    status: null,
    result: null,
    currentTestcase: 0,
    done: false,
  });
  let stream: EventStream | null = null;
  const stop = () => {
    stream?.close();
    stream = null;
  };

  /** Reads the stored row once and ends the stream; `known` is a row already fetched. */
  async function finish(
    id: string,
    known?: { status: SubmissionStatus; result: SubmissionResult | null },
  ) {
    stop();
    const row = known ?? (await fetchSubmission(id).catch(() => null));
    if (submissionId.value !== id) return;
    if (row) Object.assign(state, { status: row.status, result: row.result });
    state.done = true;
    void queryClient.invalidateQueries({ queryKey: ['submissions'] });
  }

  /** `stream` is null once finishing started, so a late final event does not finish twice. */
  function apply(id: string, status: SubmissionStatus, currentTestcase: number | null | undefined) {
    Object.assign(state, { status, currentTestcase: currentTestcase ?? 0 });
    if (FINISHED_STATUSES.includes(status) && stream) void finish(id);
  }

  /** The stored row is the truth when events were lost (`resync`) or the stream is gone (`closed`). */
  async function rereadRow(id: string, streamIsDead: boolean) {
    const row = await fetchSubmission(id).catch(() => null);
    if (submissionId.value !== id || !stream) return;
    if (!row) {
      if (streamIsDead) stop();
      return;
    }
    Object.assign(state, { status: row.status, currentTestcase: row.currentTestcase ?? 0 });
    if (FINISHED_STATUSES.includes(row.status)) void finish(id, row);
    else if (streamIsDead) stop();
  }

  watch(
    submissionId,
    (id) => {
      stop();
      Object.assign(state, { status: null, result: null, currentTestcase: 0, done: false });
      if (!id) return;
      const progress = (data: unknown) => {
        const event = data as SubmissionProgressEvent;
        apply(id, event.status, event.currentTestcase);
      };
      stream = openEventStream(
        `/events/submissions/${encodeURIComponent(id)}`,
        {
          ...Object.fromEntries(PROGRESS_EVENTS.map((type) => [type, progress])),
          state: (data) => {
            const event = data as SubmissionStateEvent;
            apply(id, event.status, event.currentTestcase);
          },
          resync: () => void rereadRow(id, false),
        },
        () => void rereadRow(id, true),
      );
    },
    { immediate: true },
  );
  onScopeDispose(stop);

  return readonly(state);
}
