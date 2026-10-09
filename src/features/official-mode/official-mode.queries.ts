import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchSite } from '@/api/site.api';
import { useSessionStore } from '@/stores/session.store';

/** `GET /site` is cached privately for 60 s by the backend; asking sooner gains nothing. */
export const SITE_STALE_MS = 60_000;
export const siteKey = ['site'] as const;

/** The public site record; only signed-in viewers ask (locks apply to signed-in actors only). */
export function useSiteQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: siteKey,
    queryFn: fetchSite,
    enabled: computed(() => session.user !== null),
    staleTime: SITE_STALE_MS,
  });
}

/** Official contest mode for this viewer: on (`isActive`), locking them (`isLocked`), or on but a superuser (`isExempt`). */
export function useOfficialMode() {
  const session = useSessionStore();
  const site = useSiteQuery();
  const isActive = computed(() => site.data.value?.officialMode === true);
  const isSuperuser = computed(() => session.user?.isSuperuser ?? false);
  /** Requires VNOI backend B8 ask: `SiteResponse.officialModeEndsAt` (ISO instant or null). */
  const endsAt = computed(() => site.data.value?.officialModeEndsAt ?? null);
  return {
    isActive,
    endsAt,
    isLocked: computed(() => isActive.value && !isSuperuser.value),
    isExempt: computed(() => isActive.value && isSuperuser.value),
  };
}
