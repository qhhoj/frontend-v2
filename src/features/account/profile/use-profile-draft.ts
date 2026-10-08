import { computed, ref, watch } from 'vue';
import { ApiError } from '@/api/client';
import type { Profile } from '@/api/types/profile';
import { useProfileQuery } from '../profile.queries';
import { useProfileUpdate } from '../use-profile-save';
import {
  changedFields,
  copyDraft,
  draftOf,
  lengthProblems,
  settleAfterSave,
  withOrganizationsOf,
} from './profile-draft';
import type { ProfileDraft } from './profile-draft';

/**
 * The draft and what it differs in. Only the first profile answer starts it, so refetches never replace typing; a stale
 * cached answer (staleTime 5 min) therefore never moves `saved` on its own.
 */
function useDraftState(source: () => Profile | undefined) {
  const draft = ref<ProfileDraft | null>(null);
  const saved = ref<ProfileDraft | null>(null);
  watch(
    source,
    (profile) => {
      if (!profile || saved.value) return;
      saved.value = draftOf(profile);
      draft.value = draftOf(profile);
    },
    { immediate: true },
  );
  const patch = computed(() =>
    draft.value && saved.value ? changedFields(draft.value, saved.value) : {},
  );
  const dirty = computed(() => Object.keys(patch.value).length > 0);
  const problems = computed(() => (draft.value ? lengthProblems(draft.value) : []));
  const reset = () => {
    if (saved.value) draft.value = copyDraft(saved.value);
  };
  return { draft, saved, patch, dirty, problems, reset };
}
type DraftState = ReturnType<typeof useDraftState>;
type Refetch = () => Promise<{ data: Profile | undefined }>;

/**
 * A 409 has two causes: an admin tried to leave an organization, or the memberships changed elsewhere. Either way the
 * server's list becomes the baseline, and the viewer's selection stays in the draft so a retry still sends it.
 */
async function reloadOrganizations(form: DraftState, refetch: Refetch) {
  const { data } = await refetch();
  if (!data || !form.saved.value) return;
  form.saved.value = withOrganizationsOf(form.saved.value, data);
}

/** All-or-nothing saves of the changed keys; over-long texts never leave the browser. */
function useDraftSaving(form: DraftState, refetch: Refetch) {
  const update = useProfileUpdate();
  const pending = ref(false);
  const error = ref<unknown>(null);
  const attempted = ref(false);
  const succeeded = ref(false);

  async function save(): Promise<boolean> {
    const current = form.draft.value;
    if (!current || !form.dirty.value || pending.value) return false;
    attempted.value = true;
    if (form.problems.value.length) return false;
    succeeded.value = false;
    const sent = copyDraft(current);
    pending.value = true;
    error.value = null;
    try {
      const stored = draftOf(await update(form.patch.value));
      form.draft.value = settleAfterSave(form.draft.value ?? sent, sent, stored);
      form.saved.value = stored;
      succeeded.value = true;
      attempted.value = false;
      return true;
    } catch (caught) {
      error.value = caught;
      if (caught instanceof ApiError && caught.code === 'conflict')
        await reloadOrganizations(form, refetch);
      return false;
    } finally {
      pending.value = false;
    }
  }
  const clear = () => {
    error.value = null;
    attempted.value = false;
  };
  /** "Đã lưu hồ sơ" stays until the viewer edits again. */
  const justSaved = computed(() => succeeded.value && !form.dirty.value);
  return { pending, error, attempted, justSaved, save, clear };
}

/** The profile form: draft, length problems, the save and its failure, undo. */
export function useProfileDraft() {
  const query = useProfileQuery();
  const form = useDraftState(() => query.data.value);
  const saving = useDraftSaving(form, () => query.refetch());
  const undo = () => {
    form.reset();
    saving.clear();
  };
  const { draft, saved, dirty, problems } = form;
  return { query, draft, saved, dirty, problems, undo, ...saving };
}
