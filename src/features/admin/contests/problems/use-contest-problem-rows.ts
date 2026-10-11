import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { editableContestKey, PUBLIC_CONTESTS_KEY } from '../contest-editing.queries';
import {
  isPointsValid,
  mergeRows,
  moveRow,
  moveRowTo,
  toProblemRows,
  toProblemsBody,
  withPoints,
} from './contest-problems';
import type { ProblemRow } from './contest-problems';
import { useAddProblem } from './use-add-problem';

const bodyJson = (rows: ProblemRow[]) => JSON.stringify(toProblemsBody(rows));

/** A row's own refusal first (points cleared or out of range), then the first server message about that row (`problems.<index>.<field>`). */
function rowIssueOf(
  rows: ProblemRow[],
  serverErrors: Record<string, string>,
  index: number,
): string | undefined {
  const row = rows[index];
  if (row && !isPointsValid(row.points)) return translate('admin.contests.problems.pointsRange');
  return Object.entries(serverErrors).find(([field]) =>
    field.startsWith(`problems.${index}.`),
  )?.[1];
}

/** The contest's ordered problem list as an editor works on it: add, copy, reorder, set points, remove, then one PATCH of the whole list. */
export function useContestProblemRows(contest: () => EditableContest) {
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  const rows = ref<ProblemRow[]>(toProblemRows(contest()));
  const seedJson = ref(bodyJson(rows.value));
  const isDirty = computed(() => bodyJson(rows.value) !== seedJson.value);
  const adding = useAddProblem(rows);

  function reseed(saved: EditableContest) {
    rows.value = toProblemRows(saved);
    seedJson.value = bodyJson(rows.value);
  }

  const mutation = useAdminMutation({
    mutate: (listed: ProblemRow[]) =>
      updateContest(contest().key, { problems: toProblemsBody(listed) }),
    invalidates: () => [PUBLIC_CONTESTS_KEY],
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
    },
  });

  const issueOf = (index: number) => rowIssueOf(rows.value, mutation.fieldErrors.value, index);

  /** Nothing is sent while a row's points are not a whole number in range. */
  const hasInvalidPoints = computed(() => rows.value.some((row) => !isPointsValid(row.points)));
  const save = () => (hasInvalidPoints.value ? undefined : mutation.run(rows.value));

  watch(contest, (next) => {
    if (!isDirty.value) reseed(next);
  });

  return {
    rows,
    ...adding,
    isDirty,
    mutation,
    issueFor: issueOf,
    move: (index: number, delta: -1 | 1) => (rows.value = moveRow(rows.value, index, delta)),
    moveTo: (index: number, target: number) => (rows.value = moveRowTo(rows.value, index, target)),
    setPoints: (problemIds: string[], points: number) =>
      (rows.value = withPoints(rows.value, problemIds, points)),
    copyRows: (incoming: ProblemRow[]) => {
      const merged = mergeRows(rows.value, incoming);
      rows.value = merged.rows;
      return { added: merged.added, skipped: merged.skipped };
    },
    remove: (index: number) =>
      (rows.value = rows.value.filter((_row, position) => position !== index)),
    save,
  };
}
