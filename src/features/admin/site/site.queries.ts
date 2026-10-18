import { useQuery } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchSiteForAdmin } from '@/api/site-admin.api';
import type { SiteData } from '@/api/types/site-admin';
import { siteKey } from '@/features/official-mode/official-mode.queries';
import { useViewerId } from '@/stores/use-viewer-id';
import { configHistoryKey } from './config-history.queries';

/** The prefix of every `/site` read: a write updates the answer by it. */
export const siteAdminKey = ['admin', 'site'] as const;

export const useSiteAdminQuery = (isEnabled: MaybeRefOrGetter<boolean> = true) => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...siteAdminKey, viewer.value]),
    queryFn: fetchSiteForAdmin,
    enabled: computed(() => toValue(isEnabled)),
  });
};

const updateSite = (queryClient: QueryClient, update: (site: SiteData) => SiteData) =>
  queryClient.setQueriesData<SiteData>({ queryKey: siteAdminKey }, (site) =>
    site ? update(site) : site,
  );

/** A saved value replaces the key's value; `null` (a deleted key) removes it. The answer is written, never refetched. */
export function writeConfig(queryClient: QueryClient, key: string, value: string | null) {
  updateSite(queryClient, (site) => {
    const config = { ...site.config };
    if (value === null) delete config[key];
    else config[key] = value;
    return { ...site, config };
  });
}

/** After a write: the key's history has a new row, and the public `/site` (the site notice) is stale. */
export function refreshAfterConfigWrite(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: configHistoryKey });
  void queryClient.invalidateQueries({ queryKey: siteKey });
}
