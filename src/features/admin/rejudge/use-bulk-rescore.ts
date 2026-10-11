import { ref } from 'vue';
import { ApiError } from '@/api/client';
import { rescoreSubmissions } from '@/api/submission-actions.api';
import type { RescoreBody, RescoreResult } from '@/api/types/submission-actions';
import { translate } from '@/i18n';
import { failureTextOf } from '../ui/admin-errors';
import { useAdminMutation } from '../ui/use-admin-mutation';
import type { RejudgeOutcome } from './use-bulk-rejudge';

export type RescorePreview =
  | { kind: 'idle' }
  | { kind: 'counting' }
  | { kind: 'ready'; result: RescoreResult }
  | { kind: 'failed'; text: string };

/** Something to recompute: the confirm opens only then. */
export const canConfirmRescore = (preview: RescorePreview): boolean =>
  preview.kind === 'ready' && preview.result.count > 0;

/** The dry run behind the rescore confirm, then the run; an overtaken dry-run answer is dropped. */
export function useBulkRescore() {
  const preview = ref<RescorePreview>({ kind: 'idle' });
  const outcome = ref<RejudgeOutcome | null>(null);
  const mutation = useAdminMutation<RescoreBody, RescoreResult>({
    mutate: rescoreSubmissions,
    invalidates: () => [['submissions'], ['admin', 'submission-batches']],
  });
  let latest = 0;

  async function count(body: RescoreBody): Promise<void> {
    const mine = ++latest;
    preview.value = { kind: 'counting' };
    try {
      const result = await rescoreSubmissions({ ...body, dryRun: true });
      if (mine === latest) preview.value = { kind: 'ready', result };
    } catch (error) {
      if (mine === latest) preview.value = { kind: 'failed', text: failureTextOf(error) };
      if (!(error instanceof ApiError)) throw error;
    }
  }

  async function rescore(body: RescoreBody): Promise<void> {
    const result = await mutation.run(body);
    if (result)
      outcome.value = {
        kind: 'done',
        text: translate('admin.rejudge.rescore.done', {
          count: result.count,
          problems: result.problems,
          contests: result.contests,
        }),
      };
    else if (mutation.failure.value)
      outcome.value = { kind: 'refused', text: failureTextOf(mutation.failure.value) };
  }

  function reset() {
    latest++;
    preview.value = { kind: 'idle' };
  }

  return { preview, outcome, count, rescore, reset, isPending: mutation.isPending };
}
