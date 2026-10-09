import { ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { putProblemData } from '@/api/problem-data.api';
import type { ProblemData, ProblemDataBody } from '@/api/types/problem-data';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { problemDataKey, useProblemDataQuery } from './problem-data.queries';
import { toDataBody, toDataForm } from './test-cases';
import type { DataForm } from './test-cases';
import { useInvalidArgs } from './use-invalid-args';

/** The data tab's form: seeded once from the query (a background refetch never overwrites an edit), saved as a whole. */
export function useDataForm(code: () => string) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const query = useProblemDataQuery(code);
  const form = ref<DataForm | null>(null);
  const errors = ref<FieldErrors>({});
  const { badRowNumbers, markInvalid } = useInvalidArgs(form);

  const mutation = useAdminMutation({
    mutate: (body: ProblemDataBody) => putProblemData(code(), body),
    onDone: (saved: ProblemData) => {
      queryClient.setQueryData(problemDataKey(code(), viewer.value), saved);
      form.value = toDataForm(saved);
    },
  });

  watch(code, () => {
    form.value = null;
  });
  watch(
    () => query.data.value,
    (data) => {
      if (data && form.value === null) form.value = toDataForm(data);
    },
    { immediate: true },
  );

  function save() {
    if (!form.value || badRowNumbers.value.length > 0) return;
    const result = toDataBody(form.value);
    if ('errors' in result) {
      errors.value = result.errors;
      return;
    }
    errors.value = {};
    void mutation.run(result.body);
  }

  return { query, form, errors, badRowNumbers, markInvalid, save, mutation };
}
