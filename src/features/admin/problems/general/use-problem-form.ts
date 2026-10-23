import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { useRoute, useRouter } from 'vue-router';
import { updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { provideDateValidity } from '../../ui/form/date-validity';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import {
  editableProblemKey,
  PROBLEM_INDEX_KEY,
  PUBLIC_PROBLEMS_KEY,
} from '../problem-editing.queries';
import {
  changedProblemFields,
  checkAllowedLanguages,
  checkProblemForm,
  cloneForm,
  toProblemForm,
} from './problem-form';
import type { ProblemForm } from './problem-form';

/** The form the user edits, and the seed it is compared with: what the server last said. */
function useFormSeed(problem: () => EditableProblem, meta: () => ProblemEditingMeta) {
  const seed = ref<ProblemForm>(toProblemForm(problem(), meta()));
  const form = ref<ProblemForm>(cloneForm(seed.value));
  const dirtyCount = computed(
    () => Object.keys(changedProblemFields(seed.value, form.value)).length,
  );
  const isDirty = computed(() => dirtyCount.value > 0);
  // A clean form follows the server: the seed and the form move together, so a later save never sends the old values back.
  watch(problem, (next) => {
    if (isDirty.value) return;
    seed.value = toProblemForm(next, meta());
    form.value = cloneForm(seed.value);
  });
  return { seed, form, dirtyCount, isDirty };
}

/** The general tab's form: seeded from the detail, PATCHes only what changed, re-seeded from the answer. */
export function useProblemForm(problem: () => EditableProblem, meta: () => ProblemEditingMeta) {
  const route = useRoute();
  const router = useRouter();
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { can } = usePermissions();
  const { seed, form, dirtyCount, isDirty } = useFormSeed(problem, meta);
  const localErrors = ref<FieldErrors>({});
  /** Why this save is made: the revision comment, never stored on the problem; cleared after each save. */
  const changeMessage = ref('');
  const savedAt = ref<Date | null>(null);
  /** True while a date box holds text that is not a date: the save is refused, never sent without it. */
  const { hasUnreadableDate, resetDates } = provideDateValidity();

  const mutation = useAdminMutation({
    mutate: (code: string) =>
      updateProblem(code, {
        ...changedProblemFields(seed.value, form.value),
        changeMessage: changeMessage.value.trim() || undefined,
      }),
    invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
    successText: (saved: EditableProblem) =>
      translate('admin.problems.general.savedToast', { code: saved.code }),
    onSuccess: () => (savedAt.value = new Date()),
    onDone: (saved: EditableProblem, code: string) => {
      queryClient.setQueryData(editableProblemKey(saved.code, viewer.value), saved);
      seed.value = toProblemForm(saved, meta());
      form.value = cloneForm(seed.value);
      changeMessage.value = '';
      if (saved.code !== code)
        void router.replace({ name: route.name!, params: { code: saved.code } });
    },
  });

  /** Puts the form back to what the server last said. */
  function discard() {
    form.value = cloneForm(seed.value);
    changeMessage.value = '';
    resetDates();
  }

  async function save() {
    localErrors.value = {
      ...checkProblemForm(form.value, can),
      ...checkAllowedLanguages(form.value, can),
    };
    if (Object.keys(localErrors.value).length === 0 && isDirty.value && !hasUnreadableDate.value) {
      await mutation.run(problem().code);
    }
  }

  // A message describes the values it was made from: editing a field retires it until the next save.
  watch(
    form,
    () => {
      localErrors.value = {};
      mutation.fieldErrors.value = {};
    },
    { deep: true },
  );

  const errors = computed<FieldErrors>(() => ({
    ...mutation.fieldErrors.value,
    ...localErrors.value,
  }));
  return {
    form,
    seed,
    dirtyCount,
    isDirty,
    savedAt,
    save,
    discard,
    errors,
    mutation,
    changeMessage,
  };
}
