import { computed, ref } from 'vue';
import { useQueryClient } from '@tanstack/vue-query';
import { updateContest } from '@/api/contest-editing.api';
import type { ContestPatch, EditableContest } from '@/api/types/contest-editing';
import { useViewerId } from '@/stores/use-viewer-id';
import { provideDateValidity } from '@/components/ui/date-validity';
import { cloneValue } from '../../ui/form/dirty-form';
import { useSeededDraft } from '../../ui/form/seeded-draft';
import { useAdminMutation } from '../../ui/use-admin-mutation';
import { toContestForm } from '../contest-form';
import { checkContestForm } from '../contest-form-checks';
import { changedContestFields } from '../contest-patch';
import type { ContestForm } from '../contest-form';
import {
  CONTEST_INDEX_KEY,
  editableContestKey,
  PUBLIC_CONTESTS_KEY,
} from '../contest-editing.queries';

const hasKeys = (object: object) => Object.keys(object).length > 0;

/**
 * The workbench's settings form over one contest: a PATCH carries only the changed members, the answer re-seeds the form,
 * and an unsaved form is never overwritten by a background refetch. The page's one save calls `validate()` and then
 * `saveTo()`. "Hiện/Ẩn" is not a field here: the status plate changes it at once.
 */
export function useContestForm(contest: () => EditableContest) {
  const viewer = useViewerId();
  const queryClient = useQueryClient();
  const seed = ref<ContestForm>(toContestForm(contest()));
  const form = ref<ContestForm>(toContestForm(contest()));
  /** Local checks gate the save; the server's field errors are shown beside their fields and cleared by the next save. */
  const localErrors = computed(() => checkContestForm(form.value));
  const pendingPatch = computed(() => {
    const patch = changedContestFields(seed.value, form.value);
    delete patch.isVisible;
    return patch;
  });
  /** The save bar's "3 thay đổi chưa lưu": one per member the PATCH would carry. */
  const dirtyCount = computed(() => Object.keys(pendingPatch.value).length);
  const isDirty = computed(() => dirtyCount.value > 0);
  /** True while a time box holds text that is not a date: the save is refused, never sent without it. */
  const { hasUnreadableDate, resetDates } = provideDateValidity();

  const { target, reseed } = useSeededDraft(contest, {
    idOf: (stored) => stored.key,
    routeParam: 'key',
    isDirty: () => isDirty.value,
    refill: (stored) => {
      seed.value = toContestForm(stored);
      form.value = toContestForm(stored);
    },
  });

  const mutation = useAdminMutation({
    mutate: ({ key, patch }: { key: string; patch: ContestPatch }) => updateContest(key, patch),
    invalidates: () => [PUBLIC_CONTESTS_KEY, CONTEST_INDEX_KEY],
    onDone: (saved: EditableContest) => {
      queryClient.setQueryData(editableContestKey(saved.key, viewer.value), saved);
      reseed(saved);
    },
  });

  /** True when the form may be sent: no local error and no date box holding text that is not a date. */
  const validate = () => !hasKeys(localErrors.value) && !hasUnreadableDate.value;

  /**
   * Sends the changed fields to the contest the form was filled from: the saved contest, or the refusal. Nothing is sent
   * (and `null` is answered) while the page shows another contest.
   */
  async function saveTo() {
    const key = target();
    if (!key) return null;
    const saved = await mutation.run({ key, patch: pendingPatch.value });
    return saved ?? mutation.failure.value;
  }

  /** Puts the form back to the last saved contest. */
  function discard() {
    form.value = cloneValue(seed.value);
    mutation.reset();
    resetDates();
  }

  const errors = computed(() => ({ ...localErrors.value, ...mutation.fieldErrors.value }));

  return {
    form,
    seed,
    errors,
    dirtyCount,
    isDirty,
    pendingPatch,
    hasUnreadableDate,
    validate,
    saveTo,
    discard,
  };
}
