import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { putProblemData } from '@/api/problem-data.api';
import type { ProblemData, ProblemDataBody } from '@/api/types/problem-data';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { countChanges } from '../../ui/form/dirty-form';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { problemDataKey, useProblemDataQuery } from './problem-data.queries';
import { checkDataForm, dataSnapshot, toDataBody, toDataForm } from './test-cases';
import type { DataForm } from './test-cases';
import { useInvalidArgs } from './use-invalid-args';

/** What a save would send, as a plain object: row keys left out, so two forms compare by their values. */
const sentShape = (form: DataForm) => JSON.parse(dataSnapshot(form)) as object;

/**
 * The data tab's form: seeded once from the query (a background refetch never overwrites an edit), saved as a whole.
 * `saved` is the configuration the form was last seeded from or saved as: the dirty count compares with it, discard goes back to it.
 */
export function useDataForm(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const query = useProblemDataQuery(code);
  const form = ref<DataForm | null>(null);
  const saved = ref<ProblemData | null>(null);
  const savedAt = ref<Date | null>(null);
  const dirtyCount = computed(() =>
    form.value && saved.value
      ? countChanges(sentShape(form.value), sentShape(toDataForm(saved.value)))
      : 0,
  );
  const errors = computed<FieldErrors>(() => (form.value ? checkDataForm(form.value) : {}));
  const { badRowNumbers, markInvalid } = useInvalidArgs(form);

  const mutation = useAdminMutation({
    mutate: (body: ProblemDataBody) => putProblemData(code(), body),
    successText: () => translate('admin.problems.data.savedToast', { code: code() }),
    onSuccess: () => (savedAt.value = new Date()),
    onDone: (answer: ProblemData) => {
      queryClient.setQueryData(problemDataKey(code(), viewer.value), answer);
      saved.value = answer;
      form.value = toDataForm(answer);
    },
  });

  function seed(data: ProblemData) {
    saved.value = data;
    form.value = toDataForm(data);
  }
  watch(code, () => {
    form.value = null;
    saved.value = null;
  });
  watch(
    () => query.data.value,
    (data) => {
      if (data && form.value === null) seed(data);
    },
    { immediate: true },
  );

  function discard() {
    if (saved.value) seed(saved.value);
  }

  function save() {
    if (!form.value || badRowNumbers.value.length > 0 || Object.keys(errors.value).length > 0)
      return;
    if (dirtyCount.value === 0) return;
    const result = toDataBody(form.value);
    if ('errors' in result) return;
    void mutation.run(result.body);
  }

  return {
    query,
    form,
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
