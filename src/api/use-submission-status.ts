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
  /** The stream closed for good and the final row could not be confirmed: the shown status may be outdated, ask the user to reload. */
  stale: boolean;
}

type StoredRow = { status: SubmissionStatus; result: SubmissionResult | null };

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
    stale: false,
  });
  let stream: EventStream | null = null;
  /** Bumped per followed id, so an answer that arrives after the id changed is dropped even when the id is back. */
  let generation = 0;
  const stop = () => {
    stream?.close();
    stream = null;
  };

  watch(
    submissionId,
    (id) => {
      stop();
      generation += 1;
      const mine = generation;
      Object.assign(state, {
        status: null,
        result: null,
        currentTestcase: 0,
        done: false,
        stale: false,
      });
      if (!id) return;

      /** Reads the stored row once and ends the stream; `known` is a row already fetched. */
      async function finish(known?: StoredRow) {
        stop();
        const row = known ?? (await fetchSubmission(id!).catch(() => null));
        if (generation !== mine) return;
        if (row) Object.assign(state, { status: row.status, result: row.result });
        state.done = true;
        void queryClient.invalidateQueries({ queryKey: ['submissions'] });
      }

      /** `stream` is null once finishing started, so a late final event does not finish twice. */
      function apply(status: unknown, currentTestcase: number | null | undefined) {
        if (typeof status !== 'string') return;
        Object.assign(state, { status, currentTestcase: currentTestcase ?? 0 });
        if (FINISHED_STATUSES.includes(status as SubmissionStatus) && stream) void finish();
      }

      /** The stored row is the truth when events were lost (`resync`) or the stream is gone (`closed`). A gone stream whose final row cannot be confirmed leaves the state `stale`. */
      async function rereadRow(streamIsDead: boolean) {
        const row = await fetchSubmission(id!).catch(() => null);
        if (generation !== mine || !stream) return;
        if (row) {
          Object.assign(state, { status: row.status, currentTestcase: row.currentTestcase ?? 0 });
          if (FINISHED_STATUSES.includes(row.status)) return void finish(row);
        }
        if (streamIsDead) {
          stop();
          state.stale = true;
        }
      }

      const progress = (data: unknown) => {
        const event = data as SubmissionProgressEvent;
        apply(event.status, event.currentTestcase);
      };
      stream = openEventStream(
        `/events/submissions/${encodeURIComponent(id)}`,
        {
          ...Object.fromEntries(PROGRESS_EVENTS.map((type) => [type, progress])),
          state: (data) => {
            const event = data as SubmissionStateEvent;
            apply(event.status, event.currentTestcase);
          },
          resync: () => void rereadRow(false),
        },
        () => void rereadRow(true),
      );
    },
    { immediate: true },
  );
  onScopeDispose(stop);

  return readonly(state);
}
