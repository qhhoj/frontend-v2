import { computed, ref, watch } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { ContestPatch, EditableContest } from '@/api/types/contest-editing';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';
import { cloneValue } from '../../ui/form/dirty-form';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { changedContestFields, checkContestForm, toContestForm } from '../contest-form';
import type { ContestForm } from '../contest-form';
import {
  CONTEST_INDEX_KEY,
  editableContestKey,
  PUBLIC_CONTESTS_KEY,
} from '../contest-editing.queries';

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
  const pendingPatch = computed(() => changedContestFields(seed.value, form.value));
  /** The save bar's "3 thay đổi chưa lưu": one per member the PATCH would carry. */
  const dirtyCount = computed(() => Object.keys(pendingPatch.value).length);
  const isDirty = computed(() => dirtyCount.value > 0);
  const savedAt = ref<Date | null>(null);

  function reseed(saved: EditableContest) {
    seed.value = toContestForm(saved);
    form.value = toContestForm(saved);
  }

  const mutation = useAdminMutation({
    mutate: (patch: ContestPatch) => updateContest(contest().key, patch),
    invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
    successText: (saved: EditableContest) =>
      translate('admin.contests.general.saved', { key: saved.key }),
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
      savedAt.value = new Date();
    },
  });

  async function save() {
    if (hasKeys(localErrors.value)) return;
    const patch = changedContestFields(seed.value, form.value);
    if (hasKeys(patch)) await mutation.run(patch);
  }

  /** Puts the form back to the last saved contest. */
  function discard() {
    form.value = cloneValue(seed.value);
    mutation.reset();
  }

  watch(contest, (next) => {
    if (!isDirty.value) reseed(next);
  });

  const errors = computed(() => ({ ...localErrors.value, ...mutation.fieldErrors.value }));

  return {
    form,
    seed,
    errors,
    dirtyCount,
    isDirty,
    savedAt,
    pendingPatch,
    save,
    discard,
    mutation,
  };
}
