import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { putProblemData } from '@/api/problem-data.api';
import type { ProblemData, ProblemDataBody } from '@/api/types/problem-data';
import type { ApiError } from '@/api/client';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { useSeededDraft } from '../../ui/form/seeded-draft';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { problemDataKey, useProblemDataQuery } from './problem-data.queries';
import { configErrors } from './checker-config';
import { checkDataForm, countDataChanges, toDataBody, toDataForm } from './test-cases';
import type { DataForm } from './test-cases';
import { useInvalidArgs } from './use-invalid-args';

/** A save of the whole configuration, to the problem it was filled from. */
interface DataSave {
  to: string;
  body: ProblemDataBody;
}

/**
 * The judging form of the workbench: seeded from the query, saved as a whole by the page's one save (`validate`, then
 * `saveTo`). A clean form follows the server (a Polygon sync, an upload), so a later save never sends the old
 * configuration back; a refetch never overwrites an edit, and a rename of the problem keeps the edits (`retarget`).
 * `saved` is the configuration the form was last seeded from or saved as: the dirty count compares with it.
 */
export function useDataForm(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const query = useProblemDataQuery(code);
  const form = ref<DataForm | null>(null);
  const saved = ref<ProblemData | null>(null);
  const dirtyCount = computed(() =>
    form.value && saved.value ? countDataChanges(form.value, toDataForm(saved.value)) : 0,
  );
  const errors = computed<FieldErrors>(() =>
    form.value ? { ...checkDataForm(form.value), ...configErrors(form.value) } : {},
  );
  const { badRows, badRowNumbers, markInvalid } = useInvalidArgs(form);

  /** Nothing typed: no change, and no args box holding text that does not parse. */
  const isClean = () => dirtyCount.value === 0 && badRowNumbers.value.length === 0;
  /** Another problem empties the form until its own data loads; the query watch below then fills it. */
  const { retarget } = useSeededDraft(code, {
    idOf: (shown) => shown,
    routeParam: 'code',
    isDirty: () => !isClean(),
    refill: () => {
      form.value = null;
      saved.value = null;
    },
  });

  const mutation = useAdminMutation({
    mutate: ({ to, body }: DataSave) => putProblemData(to, body),
    onDone: (answer: ProblemData, { to }: DataSave) => {
      queryClient.setQueryData(problemDataKey(to, viewer.value), answer);
      saved.value = answer;
      form.value = toDataForm(answer);
    },
  });

  function seed(data: ProblemData) {
    saved.value = data;
    form.value = toDataForm(data);
  }
  /** Whether the server's configuration differs from the one the form was seeded from (row keys and non-form fields aside). */
  const isNewConfig = (data: ProblemData) =>
    !saved.value || countDataChanges(toDataForm(data), toDataForm(saved.value)) > 0;
  /** A clean form takes the server's configuration when it differs; a form with edits keeps them. */
  function adopt(data: ProblemData) {
    if (isClean() && isNewConfig(data)) seed(data);
  }
  watch(
    () => query.data.value,
    (data) => {
      if (data) adopt(data);
    },
    { immediate: true },
  );

  /** Back to what the server last said, which a sync during the edit may have changed. */
  function discard() {
    const latest = query.data.value ?? saved.value;
    if (latest) seed(latest);
  }

  /** True when the form may be sent: every args box parses and no field is refused locally. */
  function validate(): boolean {
    if (!form.value) return true;
    return (
      badRowNumbers.value.length === 0 &&
      Object.keys(errors.value).length === 0 &&
      !('errors' in toDataBody(form.value))
    );
  }

  /**
   * Sends the whole configuration to the problem `to`. The answer may be a 200 that still carries the judge's complaint
   * (`feedback`: a file missing from the archive, a group not closed), so the caller shows it after every save.
   */
  async function saveTo(to: string): Promise<{ failure: ApiError | null; feedback: string }> {
    const result = form.value ? toDataBody(form.value) : null;
    if (!result || 'errors' in result) return { failure: null, feedback: '' };
    const answer = await mutation.run({ to, body: result.body });
    return { failure: mutation.failure.value, feedback: answer?.feedback ?? '' };
  }

  return {
    query,
    form,
    saved,
    errors,
    dirtyCount,
    badRows,
    badRowNumbers,
    markInvalid,
    validate,
    saveTo,
    retarget,
    adopt,
    discard,
  };
}
