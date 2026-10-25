import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { putProblemData } from '@/api/problem-data.api';
import type { ProblemData, ProblemDataBody } from '@/api/types/problem-data';
import { translate } from '@/i18n';
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
 * The data tab's form: seeded from the query, saved as a whole. A clean form follows the server (a Polygon sync, an
 * upload), so a later save never sends the old configuration back; a refetch never overwrites an edit.
 * `saved` is the configuration the form was last seeded from or saved as: the dirty count compares with it.
 */
export function useDataForm(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const query = useProblemDataQuery(code);
  const form = ref<DataForm | null>(null);
  const saved = ref<ProblemData | null>(null);
  const savedAt = ref<Date | null>(null);
  const dirtyCount = computed(() =>
    form.value && saved.value ? countDataChanges(form.value, toDataForm(saved.value)) : 0,
  );
  const errors = computed<FieldErrors>(() =>
    form.value ? { ...checkDataForm(form.value), ...configErrors(form.value) } : {},
  );
  const { badRowNumbers, markInvalid } = useInvalidArgs(form);

  /** Another problem empties the form until its own data loads; the query watch below then fills it. */
  const { target } = useSeededDraft(code, {
    idOf: (shown) => shown,
    routeParam: 'code',
    isDirty: () => false,
    refill: () => {
      form.value = null;
      saved.value = null;
    },
  });

  const mutation = useAdminMutation({
    mutate: ({ to, body }: DataSave) => putProblemData(to, body),
    successText: (_answer: ProblemData, { to }: DataSave) =>
      translate('admin.problems.data.savedToast', { code: to }),
    onSuccess: () => (savedAt.value = new Date()),
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
  /** Nothing typed: no change, and no args box holding text that does not parse. */
  const isClean = () => dirtyCount.value === 0 && badRowNumbers.value.length === 0;
  watch(
    () => query.data.value,
    (data) => {
      if (data && isClean() && isNewConfig(data)) seed(data);
    },
    { immediate: true },
  );

  /** Back to what the server last said, which a sync during the edit may have changed. */
  function discard() {
    const latest = query.data.value ?? saved.value;
    if (latest) seed(latest);
  }

  /** The configuration goes to the problem it was filled from, and nowhere while the page shows another one. */
  function save() {
    const to = target();
    if (
      !to ||
      !form.value ||
      badRowNumbers.value.length > 0 ||
      Object.keys(errors.value).length > 0
    )
      return;
    if (dirtyCount.value === 0) return;
    const result = toDataBody(form.value);
    if ('errors' in result) return;
    void mutation.run({ to, body: result.body });
  }

  return {
    query,
    form,
    saved,
    errors,
    dirtyCount,
    savedAt,
    badRowNumbers,
    markInvalid,
    save,
    discard,
    mutation,
  };
}
