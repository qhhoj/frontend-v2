import { serverNow } from '@/lib/server-clock';
import { useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, onScopeDispose, watch } from 'vue';
import { fetchSite } from '@/api/site.api';
import { useSessionStore } from '@/stores/session.store';

/** `GET /site` is cached privately for 60 s by the backend; asking sooner gains nothing. */
export const SITE_STALE_MS = 60_000;
/** While the mode is on, its end is near enough to watch; while off, a switch-on must still show up on an open page. */
export const SITE_POLL_ON_MS = 30_000;
export const SITE_POLL_OFF_MS = 5 * 60_000;
export const siteKey = ['site'] as const;

/** The public site record; only signed-in viewers ask (locks apply to signed-in actors only). */
export function useSiteQuery() {
  const session = useSessionStore();
  return useQuery({
    queryKey: siteKey,
    queryFn: fetchSite,
    enabled: computed(() => session.user !== null),
    staleTime: SITE_STALE_MS,
    refetchInterval: (query) =>
      query.state.data?.officialMode === true ? SITE_POLL_ON_MS : SITE_POLL_OFF_MS,
  });
}

/** Official contest mode for this viewer: on (`isActive`), locking them (`isLocked`), or on but a superuser (`isExempt`). */
export function useOfficialMode() {
  const session = useSessionStore();
  const site = useSiteQuery();
  /** The site notice reads `/site` for everyone into the same cache: the mode still applies to signed-in viewers only. */
  const isActive = computed(() => session.user !== null && site.data.value?.officialMode === true);
  const isSuperuser = computed(() => session.user?.isSuperuser ?? false);
  /** Needs `SiteResponse.officialModeEndsAt` (ISO instant or null). */
  const endsAt = computed(() => site.data.value?.officialModeEndsAt ?? null);
  return {
    isActive,
    endsAt,
    isLocked: computed(() => isActive.value && !isSuperuser.value),
    isExempt: computed(() => isActive.value && isSuperuser.value),
  };
}

/** setTimeout cannot wait longer than a signed 32-bit number of milliseconds. */
const MAX_TIMER_MS = 2 ** 31 - 1;

/** Asks `/site` again the moment the countdown reaches `officialModeEndsAt`, so the locks lift without waiting for the poll. */
export function useRefetchWhenOfficialModeEnds() {
  const client = useQueryClient();
  const { endsAt } = useOfficialMode();
  let timer: ReturnType<typeof setTimeout> | undefined;
  watch(
    endsAt,
    (iso) => {
      clearTimeout(timer);
      const wait = iso === null ? 0 : Date.parse(iso) - serverNow();
      if (wait > 0)
        timer = setTimeout(
          () => void client.refetchQueries({ queryKey: siteKey }),
          Math.min(wait, MAX_TIMER_MS),
        );
    },
    { immediate: true },
  );
  onScopeDispose(() => clearTimeout(timer));
}
