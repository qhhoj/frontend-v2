import { ref, watch } from 'vue';
import { slugFromName } from './organization-form';
import type { OrganizationForm } from './organization-form';

/** A create fills the address from the name until the address is typed by hand (clearing it hands it back). */
export function useSlugFromName(form: OrganizationForm) {
  const isSlugTyped = ref(false);
  watch(
    () => form.name,
    (name) => {
      if (!isSlugTyped.value) form.slug = slugFromName(name);
    },
  );
  return {
    onSlugInput: () => (isSlugTyped.value = form.slug !== ''),
    release: () => (isSlugTyped.value = false),
  };
}
