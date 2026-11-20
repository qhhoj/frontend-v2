import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import { useSeededDraft } from '../../ui/form/seeded-draft';
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

/** How many problems differ from the saved list: added, removed, moved or edited, each counted once. */
export function changedProblemCount(saved: ProblemRow[], current: ProblemRow[]): number {
  const entryOf = (rows: ProblemRow[]) =>
    new Map(
      toProblemsBody(rows).map((entry, index) => [
        rows[index]!.problemId,
        JSON.stringify({ ...entry, index }),
      ]),
    );
  const before = entryOf(saved);
  const after = entryOf(current);
  const ids = new Set([...before.keys(), ...after.keys()]);
  return [...ids].filter((id) => before.get(id) !== after.get(id)).length;
}

/** A limit box holding text the browser cannot read is NaN (`numberBoxValue`) and must not be saved as a clear. */
const hasUnreadableLimit = (row: ProblemRow) =>
  Number.isNaN(row.outputPrefix) || Number.isNaN(row.maxSubmissions);

/** A row's own refusal first (points cleared or out of range), then the first server message about that row (`problems.<index>.<field>`). */
function rowIssueOf(
  rows: ProblemRow[],
  serverErrors: Record<string, string>,
  index: number,
): string | undefined {
  const row = rows[index];
  if (row && !isPointsValid(row.points)) return translate('admin.contests.problems.pointsRange');
  if (row && hasUnreadableLimit(row)) return translate('admin.contests.general.errors.notNumber');
  return Object.entries(serverErrors).find(([field]) =>
    field.startsWith(`problems.${index}.`),
  )?.[1];
}

/**
 * The contest's ordered problem list as an editor works on it: add, copy, reorder, set points, remove, then one PATCH of
 * the whole list. The page's one save calls `validate()` and then `saveTo()`.
 */
export function useContestProblemRows(contest: () => EditableContest) {
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  const rows = ref<ProblemRow[]>(toProblemRows(contest()));
  const seedRows = ref<ProblemRow[]>(toProblemRows(contest()));
  const seedJson = computed(() => bodyJson(seedRows.value));
  const isDirty = computed(() => bodyJson(rows.value) !== seedJson.value);
  const dirtyCount = computed(() =>
    isDirty.value ? Math.max(1, changedProblemCount(seedRows.value, rows.value)) : 0,
  );
  const adding = useAddProblem(rows);

  const { target, reseed } = useSeededDraft(contest, {
    idOf: (stored) => stored.key,
    routeParam: 'key',
    isDirty: () => isDirty.value,
    refill: (stored) => {
      rows.value = toProblemRows(stored);
      seedRows.value = toProblemRows(stored);
    },
  });

  const mutation = useAdminMutation({
    mutate: ({ key, listed }: { key: string; listed: ProblemRow[] }) =>
      updateContest(key, { problems: toProblemsBody(listed) }),
    invalidates: () => [PUBLIC_CONTESTS_KEY],
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
    },
  });

  const issueOf = (index: number) => rowIssueOf(rows.value, mutation.fieldErrors.value, index);

  /** Nothing is sent while a row's points are not a whole number in range or a limit box is unreadable. */
  const hasInvalidPoints = computed(() =>
    rows.value.some((row) => !isPointsValid(row.points) || hasUnreadableLimit(row)),
  );
  /**
   * Sends the list to the contest it was filled from: the saved contest, or the refusal. Nothing is sent (and `null` is
   * answered) while the page shows another contest.
   */
  async function saveTo() {
    const key = target();
    if (!key) return null;
    const saved = await mutation.run({ key, listed: rows.value });
    return saved ?? mutation.failure.value;
  }

  return {
    rows,
    ...adding,
    isDirty,
    dirtyCount,
    validate: () => !hasInvalidPoints.value,
    discard: () => {
      rows.value = seedRows.value.map((row) => ({ ...row }));
      mutation.reset();
    },
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
    saveTo,
  };
}
