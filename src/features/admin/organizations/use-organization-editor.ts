import { computed, ref } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import { useOrganizationQuery } from '@/features/organizations/organizations.queries';
import { usePermissions } from '@/stores/use-permissions';
import type { FieldErrors } from '../ui/admin-errors';
import {
  changedOrganizationFields,
  checkOrganizationForm,
  toOrganizationBody,
} from './organization-form';
import { useOrganizationFormState } from './organization-form-state';
import type { SaveRequest } from './organization-save';
import { useOrganizationSave } from './organization-save';

/**
 * The editor of one organization, or of a new one when `slug()` is null. `slug()` is read once: the page keys the editor by
 * organization, so a create and an edit never share an instance.
 */
export function useOrganizationEditor(
  slug: () => string | null,
  onSaved: (saved: OrganizationDetail) => unknown,
) {
  const { can } = usePermissions();
  const canEditAll = computed(() => can('judge.edit_all_organization'));
  const isCreate = slug() === null;
  const detail = isCreate ? null : useOrganizationQuery(() => slug() ?? '');
  /** A loaded organization the viewer neither administers nor may edit as staff: the backend refuses every save with 403. */
  const isReadOnly = computed(() => {
    const loaded = detail?.data.value;
    return loaded !== undefined && loaded.viewer?.canAdminister !== true;
  });
  const { baseline, form, seed } = useOrganizationFormState(() => detail?.data.value);
  const write = useOrganizationSave(seed, onSaved);
  const clientErrors = ref<FieldErrors>({});
  /** The fields a save would send: the save bar's "3 thay đổi chưa lưu". */
  const dirtyCount = computed(
    () => Object.keys(changedOrganizationFields(baseline.value, form, canEditAll.value)).length,
  );

  /** What a save would send, or null when an edit changed nothing. */
  function requestOf(): SaveRequest | null {
    if (isCreate) return { kind: 'create', body: toOrganizationBody(form, canEditAll.value) };
    const patch = changedOrganizationFields(baseline.value, form, canEditAll.value);
    return Object.keys(patch).length === 0 ? null : { kind: 'edit', slug: slug() ?? '', patch };
  }

  /** Checks the form first; a failed check sends nothing and shows its field texts. */
  function save(): Promise<boolean> {
    clientErrors.value = checkOrganizationForm(form, canEditAll.value, isCreate);
    if (Object.keys(clientErrors.value).length > 0) return Promise.resolve(false);
    const request = requestOf();
    return request ? write.run(request) : Promise.resolve(false);
  }

  /** Back to the last saved state (an unsaved create goes back to the empty form). */
  function reset() {
    clientErrors.value = {};
    seed(baseline.value);
  }

  return {
    form,
    detail: computed(() => detail?.data.value),
    isCreate,
    canEditAll,
    isReadOnly,
    dirtyCount,
    errors: computed<FieldErrors>(() => ({
      ...clientErrors.value,
      ...write.fieldErrors.value,
    })),
    mutation: write,
    save,
    reset,
  };
}
