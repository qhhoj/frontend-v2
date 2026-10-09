import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchLanguagesAdmin } from '@/api/languages-admin.api';
import { useViewerId } from '@/stores/use-viewer-id';

/** Prefix of the list's key: every languages query starts with it, so one invalidation covers the list and the forms. */
export const languagesAdminKey = ['admin', 'languages'] as const;

export function useLanguagesAdminQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...languagesAdminKey, viewer.value]),
    queryFn: fetchLanguagesAdmin,
  });
}
