import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { ContestPatch, EditableContest } from '@/api/types/contest-editing';
import { useViewerId } from '@/stores/use-viewer-id';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { changedContestFields, checkContestForm, toContestForm } from '../contest-form';
import type { ContestForm } from '../contest-form';
import { editableContestKey } from '../contest-editing.queries';

const hasKeys = (object: object) => Object.keys(object).length > 0;

/**
 * The general tab's form over one contest: a PATCH carries only the changed members, the answer re-seeds the form, and an
 * unsaved form is never overwritten by a background refetch.
 */
export function useContestForm(contest: () => EditableContest) {
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  const seed = ref<ContestForm>(toContestForm(contest()));
  const form = ref<ContestForm>(toContestForm(contest()));
  /** Local checks gate the save; the server's field errors are shown beside their fields and cleared by the next save. */
  const localErrors = computed(() => checkContestForm(form.value));
  const isDirty = computed(() => hasKeys(changedContestFields(seed.value, form.value)));

  function reseed(saved: EditableContest) {
    seed.value = toContestForm(saved);
    form.value = toContestForm(saved);
  }

  const mutation = useAdminMutation({
    mutate: (patch: ContestPatch) => updateContest(contest().key, patch),
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
    },
  });

  async function save() {
    if (hasKeys(localErrors.value)) return;
    const patch = changedContestFields(seed.value, form.value);
    if (hasKeys(patch)) await mutation.run(patch);
  }

  watch(contest, (next) => {
    if (!isDirty.value) reseed(next);
  });

  const errors = computed(() => ({ ...localErrors.value, ...mutation.fieldErrors.value }));

  return { form, errors, isDirty, save, mutation };
}
