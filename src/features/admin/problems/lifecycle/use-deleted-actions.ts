import { useQueryClient } from '@tanstack/vue-query';
import { ref } from 'vue';
import { purgeProblemNow, restoreProblem } from '@/api/problem-lifecycle.api';
import { translate } from '@/i18n';
import { failureTextOf, isConflict } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { PROBLEM_INDEX_KEY, PUBLIC_PROBLEMS_KEY } from '../problem-editing.queries';
import { DELETED_PROBLEMS_KEY, SUBMISSIONS_KEY } from './lifecycle.queries';

export interface DeletedOutcome {
  kind: 'done' | 'queued' | 'refused';
  text: string;
}
interface PurgeCommand {
  code: string;
  confirmCode: string;
}

/** Restore and purge-now for the deleted list, and the one result line the page shows. */
export function useDeletedActions() {
  const queryClient = useQueryClient();
  const outcome = ref<DeletedOutcome | null>(null);
  const restore = useAdminMutation({
    mutate: (code: string) => restoreProblem(code),
    invalidates: () => [
      DELETED_PROBLEMS_KEY,
      PROBLEM_INDEX_KEY,
      PUBLIC_PROBLEMS_KEY,
      SUBMISSIONS_KEY,
    ],
    onDone: (_result, code) => {
      outcome.value = { kind: 'done', text: translate('admin.lifecycle.restored', { code }) };
    },
  });
  const purge = useAdminMutation({
    mutate: (command: PurgeCommand) => purgeProblemNow(command.code, command.confirmCode),
    invalidates: () => [DELETED_PROBLEMS_KEY],
    onDone: (_result, command) => {
      outcome.value = {
        kind: 'queued',
        text: translate('admin.lifecycle.purgeQueued', { code: command.code }),
      };
    },
  });

  /** A conflict (already purged, restored, or claimed by a purge) means the row is stale: reload the list. */
  const reloadWhenStale = async (failure: unknown) => {
    if (isConflict(failure))
      await queryClient.invalidateQueries({ queryKey: DELETED_PROBLEMS_KEY });
  };

  async function restoreRow(code: string) {
    outcome.value = null;
    await restore.run(code);
    const failure = restore.failure.value;
    if (!failure) return;
    outcome.value = { kind: 'refused', text: failureTextOf(failure) };
    await reloadWhenStale(failure);
  }

  /** Purge-now: a refusal stays in the dialog (page decides), and a stale-row conflict reloads the list behind it. */
  async function purgeRow(command: PurgeCommand) {
    const result = await purge.run(command);
    await reloadWhenStale(purge.failure.value);
    return result;
  }

  /** Clears an earlier dialog refusal before the dialog opens for another row. */
  function openPurgeFor() {
    purge.reset();
    outcome.value = null;
  }

  return { restore, purge, outcome, restoreRow, purgeRow, openPurgeFor };
}
