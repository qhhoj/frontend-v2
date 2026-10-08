import { ref } from 'vue';
import { ApiError } from '@/api/client';
import { rejudgeSubmissions } from '@/api/submission-actions.api';
import type { RejudgeBody, RejudgeResult } from '@/api/types/submission-actions';
import { translate } from '@/i18n';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';

/** `done` is the queued count; `refused` is the text of the page's line. */
export interface RejudgeOutcome {
  kind: 'done' | 'refused';
  text: string;
}

/** The dry run's answer, or the ApiError it failed with. Anything else is a bug and is not hidden here. */
async function dryRunOf(body: RejudgeBody): Promise<RejudgeResult | ApiError> {
  try {
    return await rejudgeSubmissions({ ...body, dryRun: true });
  } catch (error) {
    if (error instanceof ApiError) return error;
    throw error;
  }
}

/**
 * A 403 is worded by its cause. A dry run that answers names the cause: `allowed: false` is the lot limit. A dry run that
 * fails (a wait, a server error, or its own 403) is a failure, worded as one, never as the lot refusal.
 */
async function refusalTextOf(error: ApiError, body: RejudgeBody): Promise<string> {
  if (error.status !== 403) return failureTextOf(error);
  const dryRun = await dryRunOf(body);
  if (dryRun instanceof ApiError) return failureTextOf(dryRun);
  return dryRun.allowed ? translate('errors.forbidden') : translate('admin.rejudge.refusedLot');
}

/** One bulk rejudge: the request, and the line the page shows for its answer. Never throws; the filter is never cleared here. */
export function useBulkRejudge() {
  const outcome = ref<RejudgeOutcome | null>(null);
  const mutation = useAdminMutation<RejudgeBody, RejudgeResult>({
    mutate: rejudgeSubmissions,
  });

  async function rejudge(body: RejudgeBody): Promise<void> {
    try {
      const result = await mutation.run(body);
      if (result) {
        outcome.value = {
          kind: 'done',
          text: translate('admin.rejudge.done', { count: result.count }),
        };
      } else if (mutation.failure.value) {
        const text = await refusalTextOf(mutation.failure.value, body);
        outcome.value = { kind: 'refused', text };
      }
    } catch (error) {
      outcome.value = { kind: 'refused', text: failureTextOf(error) };
    }
  }

  return { rejudge, outcome, isPending: mutation.isPending };
}
