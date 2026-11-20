import type { RejudgeBody } from '@/api/types/submission-actions';
import { queuedLinkQuery } from '../submissions/admin-submission-filters';
import { useBulkRejudge } from './use-bulk-rejudge';
import type { RejudgeOutcome } from './use-bulk-rejudge';
import { canConfirmRejudge, useRejudgeCount } from './use-rejudge-count';

/**
 * The two steps of every bulk rejudge. `ask` counts with a dry run; `confirm` sends the real request. The body is
 * copied when asked, so what is sent is what was counted whatever the page's filter does meanwhile, and `confirm` sends
 * nothing until that count has answered with a permitted, non-empty batch.
 */
export function useRejudgeConfirm() {
  const counter = useRejudgeCount();
  const bulk = useBulkRejudge();
  let asked: RejudgeBody | null = null;

  async function ask(body: RejudgeBody): Promise<void> {
    asked = JSON.parse(JSON.stringify(body)) as RejudgeBody;
    await counter.count(asked);
  }

  /** The outcome of the real request, or null when nothing was sent. */
  async function confirm(): Promise<RejudgeOutcome | null> {
    if (!asked || !canConfirmRejudge(counter.state.value)) return null;
    await bulk.rejudge(asked, queuedLinkQuery(asked));
    return bulk.outcome.value;
  }

  function close() {
    asked = null;
    counter.reset();
  }

  return { state: counter.state, isPending: bulk.isPending, ask, confirm, close };
}
