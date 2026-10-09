import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchLanguagesAdmin } from '@/api/languages-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Prefix of the list's key: every languages query starts with it, so one invalidation covers the list and the forms. */
export const languagesAdminKey = ['admin', 'languages'] as const;

/** `enabled` lets the new-language page skip a list it never shows (a refusal there would be noise). */
export function useLanguagesAdminQuery(options: { enabled?: MaybeRefOrGetter<boolean> } = {}) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...languagesAdminKey, viewer.value]),
    queryFn: fetchLanguagesAdmin,
    enabled: options.enabled,
  });
}
