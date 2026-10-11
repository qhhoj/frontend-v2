import { ref } from 'vue';
import { ApiError } from '@/api/client';
import { rejudgeSubmissions } from '@/api/submission-actions.api';
import type { RejudgeBody } from '@/api/types/submission-actions';
import type { SubmissionListItem } from '@/api/types/submissions';
import { failureTextOf } from '../ui/admin-errors';

/** Above this many submissions a rejudge needs `judge.rejudge_submission_lot` (backend `BULK_REJUDGE_LIMIT`). */
export const BULK_REJUDGE_LIMIT = 10;

export type RejudgeCountState =
  | { kind: 'idle' }
  | { kind: 'counting' }
  | {
      kind: 'ready';
      count: number;
      allowed: boolean;
      countedAt: string;
      sample: SubmissionListItem[];
    }
  | { kind: 'failed'; text: string };

/** The confirm opens for a counted, permitted, non-empty rejudge and for nothing else. */
export const canConfirmRejudge = (state: RejudgeCountState): boolean =>
  state.kind === 'ready' && state.allowed && state.count > 0;

/**
 * The dry run behind the confirm. Each `count` replaces the state; an answer that a later `count` or a `reset` has overtaken is
 * dropped, so closing and reopening the dialog never shows the earlier count.
 */
export function useRejudgeCount(now: () => Date = () => new Date()) {
  const state = ref<RejudgeCountState>({ kind: 'idle' });
  let latest = 0;

  async function count(body: RejudgeBody): Promise<void> {
    const mine = ++latest;
    state.value = { kind: 'counting' };
    try {
      const result = await rejudgeSubmissions({ ...body, dryRun: true });
      if (mine !== latest) return;
      state.value = {
        kind: 'ready',
        count: result.count,
        allowed: result.allowed,
        countedAt: now().toISOString(),
        sample: result.sample,
      };
    } catch (error) {
      if (mine === latest) state.value = { kind: 'failed', text: failureTextOf(error) };
      // Anything but an ApiError is a bug: the dialog leaves "counting", and the error still reaches the error handler.
      if (!(error instanceof ApiError)) throw error;
    }
  }

  function reset() {
    latest++;
    state.value = { kind: 'idle' };
  }

  return { state, count, reset };
}
