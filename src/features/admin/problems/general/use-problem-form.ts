import { computed, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateProblem } from '@/api/problem-editing.api';
import type { EditableProblem, ProblemEditingMeta } from '@/api/types/problem-editing';
import { usePermissions } from '@/stores/use-permissions';
import { useViewerId } from '@/stores/use-viewer-id';
import type { FieldErrors } from '../../ui/admin-errors';
import { useSeededDraft } from '../../ui/form/seeded-draft';
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
  const { reseed } = useSeededDraft(problem, {
    idOf: (stored) => stored.code,
    routeParam: 'code',
    isDirty: () => isDirty.value,
    refill: (stored) => {
      seed.value = toProblemForm(stored, meta());
      form.value = cloneForm(seed.value);
    },
  });
  return { seed, form, dirtyCount, reseed };
}

/** The date boxes' state of the page that owns the save (`provideDateValidity`, called once per page). */
export interface FormDates {
  hasUnreadableDate: Ref<boolean>;
  resetDates: () => void;
}

/** What one problem PATCH sends besides the changed info fields: the original statement, when it changed too. */
export interface ProblemPatchExtra {
  description?: string;
}

/**
 * The workbench's info form: seeded from the detail, PATCHes only what changed, re-seeded from the answer. The page's one
 * save calls `validate()` and then `saveTo()`; a renamed problem's route change is the page's job, after every part is sent.
 */
export function useProblemForm(
  problem: () => EditableProblem,
  meta: () => ProblemEditingMeta,
  dates: FormDates,
) {
  const queryClient = useQueryClient();
  const viewer = useViewerId();
  const { can } = usePermissions();
  const { seed, form, dirtyCount, reseed } = useFormSeed(problem, meta);
  const localErrors = ref<FieldErrors>({});
  /** Why this save is made: the revision comment, never stored on the problem; cleared after each save. */
  const changeMessage = ref('');

  const mutation = useAdminMutation({
    mutate: ({ code, extra }: { code: string; extra: ProblemPatchExtra }) =>
      updateProblem(code, {
        ...changedProblemFields(seed.value, form.value),
        ...extra,
        changeMessage: changeMessage.value.trim() || undefined,
      }),
    invalidates: () => [PUBLIC_PROBLEMS_KEY, PROBLEM_INDEX_KEY],
    onDone: (saved: EditableProblem) => {
      queryClient.setQueryData(editableProblemKey(saved.code, viewer.value), saved);
      reseed(saved);
      changeMessage.value = '';
    },
  });

  /** Puts the form back to what the server last said. */
  function discard() {
    form.value = cloneForm(seed.value);
    changeMessage.value = '';
    dates.resetDates();
  }

  /** Checks the form and shows what is wrong under each field; true when it may be sent. */
  function validate(): boolean {
    localErrors.value = {
      ...checkProblemForm(form.value, can),
      ...checkAllowedLanguages(form.value, can, seed.value),
    };
    return Object.keys(localErrors.value).length === 0 && !dates.hasUnreadableDate.value;
  }

  /** Sends the changed fields (and `extra`) to the problem `code`: the saved problem, or the refusal. */
  async function saveTo(code: string, extra: ProblemPatchExtra = {}) {
    const saved = await mutation.run({ code, extra });
    return saved ?? mutation.failure.value;
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
  return { form, seed, dirtyCount, errors, changeMessage, validate, saveTo, discard };
}
