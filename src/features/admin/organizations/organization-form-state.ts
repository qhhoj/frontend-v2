import { computed, reactive, ref, watch } from 'vue';
import type { OrganizationDetail } from '@/api/types/organizations';
import {
  changedOrganizationFields,
  emptyOrganizationForm,
  toOrganizationForm,
} from './organization-form';
import type { OrganizationForm } from './organization-form';

const copyOf = (form: OrganizationForm): OrganizationForm => structuredClone(form);

/**
 * The form and the last saved state it is compared with. A loaded organization seeds both; a refetch seeds them again only
 * while nothing is typed, so unsaved input is never overwritten.
 */
export function useOrganizationFormState(loaded: () => OrganizationDetail | undefined) {
  const baseline = ref<OrganizationForm>(emptyOrganizationForm());
  const form = reactive<OrganizationForm>(emptyOrganizationForm());
  const isDirty = computed(
    () => Object.keys(changedOrganizationFields(baseline.value, form, true)).length > 0,
  );

  function seed(next: OrganizationForm) {
    baseline.value = copyOf(next);
    Object.assign(form, copyOf(next));
  }

  watch(
    loaded,
    (detail) => {
      if (detail && !isDirty.value) seed(toOrganizationForm(detail));
    },
    { immediate: true },
  );

  return { baseline, form, isDirty, seed };
}
