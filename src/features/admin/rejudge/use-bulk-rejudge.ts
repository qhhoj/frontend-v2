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

/** A dry run names the cause of a 403: `allowed: false` is the lot limit; a dry run that is refused too means a plain refusal. */
async function isOverLotLimit(body: RejudgeBody): Promise<boolean> {
  try {
    const dryRun = await rejudgeSubmissions({ ...body, dryRun: true });
    return !dryRun.allowed;
  } catch (error) {
    if (!(error instanceof ApiError)) throw error;
    return false;
  }
}

/** Only a 403 is worded by its cause; every other failure keeps its own text. */
async function refusalTextOf(error: ApiError, body: RejudgeBody): Promise<string> {
  if (error.status !== 403) return failureTextOf(error);
  return (await isOverLotLimit(body))
    ? translate('admin.rejudge.refusedLot')
    : translate('errors.forbidden');
}

/** One bulk rejudge: the request, and the line the page shows for its answer. The filter is never cleared here. */
export function useBulkRejudge() {
  const outcome = ref<RejudgeOutcome | null>(null);
  const mutation = useAdminMutation<RejudgeBody, RejudgeResult>({
    mutate: rejudgeSubmissions,
  });

  async function rejudge(body: RejudgeBody): Promise<void> {
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
  }

  return { rejudge, outcome, isPending: mutation.isPending };
}
