import { useQuery } from '@tanstack/vue-query';
import type { QueryClient } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchSiteForAdmin } from '@/api/site-admin.api';
import type { NavigationItem, SiteData } from '@/api/types/site-admin';
import { useViewerId } from '@/stores/use-viewer-id';

/** The prefix of every `/site` read: a write updates the answer by it. */
export const siteAdminKey = ['admin', 'site'] as const;

export const useSiteAdminQuery = () => {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...siteAdminKey, viewer.value]),
    queryFn: fetchSiteForAdmin,
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

/** A saved entry replaces the one with its id (or joins the list); a deleted one leaves it. */
export function writeNavigation(
  queryClient: QueryClient,
  change: NavigationItem | { deletedId: string },
) {
  updateSite(queryClient, (site) => ({
    ...site,
    navigation:
      'deletedId' in change
        ? site.navigation.filter((item) => item.id !== change.deletedId)
        : upsertItem(site.navigation, change),
  }));
}

const upsertItem = (items: NavigationItem[], item: NavigationItem): NavigationItem[] =>
  items.some((candidate) => candidate.id === item.id)
    ? items.map((candidate) => (candidate.id === item.id ? item : candidate))
    : [...items, item];
