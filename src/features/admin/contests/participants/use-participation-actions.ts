import { Ban, CalendarClock, RefreshCw, RotateCcw, Trash2 } from 'lucide-vue-next';
import { ref } from 'vue';
import {
  deleteParticipation,
  moveParticipationStart,
  recomputeParticipation,
} from '@/api/contest-admin.api';
import { setDisqualified } from '@/api/contest-editing.api';
import type { Participation } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import type { RowMenuItem } from '../../ui/table/AdminRowMenu.vue';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import type { AdminQueryKey } from '../../ui/use-admin-mutation';

/** The actions that confirm in a dialog first. */
export type ParticipationDialog = 'moveStart' | 'disqualify' | 'restore' | 'delete';

/**
 * A participation's row actions: recompute runs at once; moving the start, disqualifying, restoring and deleting open a
 * dialog (`open`). The backend writes the contest's banned-users list on a (re)disqualify, so the contest settings are
 * refetched too: a later General save must not send the stale list and un-ban the user.
 */
export function useParticipationActions(contestKey: () => string) {
  const open = ref<{ dialog: ParticipationDialog; row: Participation } | null>(null);
  const invalidates = (): AdminQueryKey[] => [
    ['admin', 'participations', contestKey()],
    ['admin', 'contest', contestKey()],
    ['contests', 'ranking'],
  ];
  const close = () => {
    open.value = null;
  };
  const named = (key: string) => (_result: unknown, row: Participation) =>
    translate(key, { username: row.user.username });

  const restore = useAdminMutation({
    mutate: (row: Participation) => setDisqualified(contestKey(), row.id, false),
    invalidates,
    successText: named('admin.contestOps.participants.restored'),
    onDone: close,
  });
  const recompute = useAdminMutation({
    mutate: (row: Participation) => recomputeParticipation(contestKey(), row.id),
    successText: named('admin.contestOps.participants.recomputeQueuedFor'),
  });
  const disqualify = useAdminMutation({
    mutate: (row: Participation) => setDisqualified(contestKey(), row.id, true),
    invalidates,
    successText: named('admin.contestOps.participants.disqualified'),
    onDone: close,
  });
  const moveStart = useAdminMutation({
    mutate: ({ row, start }: { row: Participation; start: string }) =>
      moveParticipationStart(contestKey(), row.id, start),
    invalidates,
    successText: (_result, { row }) =>
      translate('admin.contestOps.participants.startMoved', { username: row.user.username }),
    onDone: close,
  });
  const remove = useAdminMutation({
    mutate: (row: Participation) => deleteParticipation(contestKey(), row.id),
    invalidates,
    successText: named('admin.contestOps.participants.deleted'),
    onDone: close,
  });

  function openDialog(dialog: ParticipationDialog, row: Participation) {
    ({ moveStart, disqualify, restore, delete: remove })[dialog].reset();
    open.value = { dialog, row };
  }

  const menuOf = (row: Participation): RowMenuItem[] => [
    {
      label: translate('admin.contestOps.participants.moveStart'),
      icon: CalendarClock,
      run: () => openDialog('moveStart', row),
    },
    {
      label: translate('common.rescore'),
      icon: RefreshCw,
      run: () => void recompute.run(row),
    },
    row.isDisqualified
      ? {
          label: translate('admin.contests.participants.restore'),
          icon: RotateCcw,
          run: () => openDialog('restore', row),
        }
      : {
          label: translate('admin.contests.participants.disqualify'),
          icon: Ban,
          danger: true,
          run: () => openDialog('disqualify', row),
        },
    {
      label: translate('common.delete'),
      icon: Trash2,
      danger: true,
      run: () => openDialog('delete', row),
    },
  ];

  /** A refusal of an action that ran without a dialog, for the line above the table. */
  const directFailure = () => recompute.failure.value;

  return { open, close, menuOf, directFailure, disqualify, restore, moveStart, remove };
}
export type ParticipationActions = ReturnType<typeof useParticipationActions>;
