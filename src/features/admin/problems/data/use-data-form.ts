import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { putProblemData } from '@/api/problem-data.api';
import type { ProblemData, ProblemDataBody } from '@/api/types/problem-data';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { problemDataKey, useProblemDataQuery } from './problem-data.queries';
import { checkDataForm, dataSnapshot, toDataBody, toDataForm } from './test-cases';
import type { DataForm } from './test-cases';
import { useInvalidArgs } from './use-invalid-args';

/** Seeds the form from the stored configuration, once: a form the viewer has touched is never overwritten by a refetch. */
function seedOnce(
  form: Ref<DataForm | null>,
  savedSnapshot: Ref<string>,
  data: ProblemData | undefined,
) {
  if (!data || form.value !== null) return;
  form.value = toDataForm(data);
  savedSnapshot.value = dataSnapshot(form.value);
}

/** The data tab's form: seeded once from the query (a background refetch never overwrites an edit), saved as a whole. */
export function useDataForm(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const query = useProblemDataQuery(code);
  const form = ref<DataForm | null>(null);
  /** The snapshot of the last saved (or seeded) form: the unsaved-change guard compares against it. */
  const savedSnapshot = ref('');
  const isDirty = computed(
    () => form.value !== null && dataSnapshot(form.value) !== savedSnapshot.value,
  );
  const errors = computed<FieldErrors>(() => (form.value ? checkDataForm(form.value) : {}));
  const { badRowNumbers, markInvalid } = useInvalidArgs(form);
  let sentSnapshot = '';

  const mutation = useAdminMutation({
    mutate: (body: ProblemDataBody) => putProblemData(code(), body),
    onDone: (saved: ProblemData) => {
      queryClient.setQueryData(problemDataKey(code(), viewer.value), saved);
      form.value = toDataForm(saved);
      savedSnapshot.value = sentSnapshot;
    },
  });

  watch(code, () => {
    form.value = null;
  });
  watch(
    () => query.data.value,
    (data) => seedOnce(form, savedSnapshot, data),
    { immediate: true },
  );

  function save() {
    if (!form.value || badRowNumbers.value.length > 0 || Object.keys(errors.value).length > 0)
      return;
    const result = toDataBody(form.value);
    if ('errors' in result) return;
    sentSnapshot = dataSnapshot(form.value);
    void mutation.run(result.body);
  }

  return { query, form, errors, isDirty, badRowNumbers, markInvalid, save, mutation };
}
