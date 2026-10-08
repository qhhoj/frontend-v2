import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { EditableContest } from '@/api/types/contest-editing';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { editableContestKey } from '../contest-editing.queries';
import { moveRow, toProblemRows, toProblemsBody } from './contest-problems';
import type { ProblemRow } from './contest-problems';
import { useAddProblem } from './use-add-problem';

const bodyJson = (rows: ProblemRow[]) => JSON.stringify(toProblemsBody(rows));

/** The contest's ordered problem list as an editor works on it: add by code, reorder, remove, then one PATCH of the whole list. */
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
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
    },
  });

  /** The first server message about a row (`problems.<index>.<field>`), shown under that row. */
  const issueFor = (index: number): string | undefined =>
    Object.entries(mutation.fieldErrors.value).find(([field]) =>
      field.startsWith(`problems.${index}.`),
    )?.[1];

  watch(contest, (next) => {
    if (!isDirty.value) reseed(next);
  });

  return {
    rows,
    ...adding,
    isDirty,
    mutation,
    issueFor,
    move: (index: number, delta: -1 | 1) => (rows.value = moveRow(rows.value, index, delta)),
    remove: (index: number) =>
      (rows.value = rows.value.filter((_row, position) => position !== index)),
    save: () => mutation.run(rows.value),
  };
}
