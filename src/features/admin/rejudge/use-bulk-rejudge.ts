import { ref } from 'vue';
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

/** One bulk rejudge: the request, and the line the page shows for its answer. Never throws; the filter is never cleared here. */
export function useBulkRejudge() {
  const outcome = ref<RejudgeOutcome | null>(null);
  const mutation = useAdminMutation<RejudgeBody, RejudgeResult>({
    mutate: rejudgeSubmissions,
    invalidates: () => [['submissions']],
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
        outcome.value = { kind: 'refused', text: failureTextOf(mutation.failure.value) };
      }
    } catch (error) {
      outcome.value = { kind: 'refused', text: failureTextOf(error) };
    }
  }

  return { rejudge, outcome, isPending: mutation.isPending };
}
