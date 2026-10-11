import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchOrganizations } from '@/api/organizations.api';
import { fetchAdminOrganizations } from '@/api/organizations-admin.api';

/** Pages of the public list read to name ids (100 each); the administered list adds unlisted ones. */
const MAX_PAGES = 5;
const PAGE_SIZE = 100;

async function fetchNamesById(): Promise<Map<string, string>> {
  const names = new Map<string, string>();
  const remember = (items: { id: string; name: string }[]) =>
    items.forEach((item) => names.set(item.id, item.name));
  remember((await fetchAdminOrganizations(1, '', {})).items);
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, meta } = await fetchOrganizations(page);
    remember(items);
    if (page * PAGE_SIZE >= (meta.total ?? 0)) break;
  }
  return names;
}

/** The names of organizations the API gave only as ids (an edit form's `organizations`); read once, only while `isNeeded`. */
export function useOrganizationNames(isNeeded: MaybeRefOrGetter<boolean>) {
  const query = useQuery({
    queryKey: ['organizations', 'names-by-id'],
    queryFn: fetchNamesById,
    enabled: computed(() => toValue(isNeeded)),
    staleTime: 60_000,
  });
  return computed(() => query.data.value ?? new Map<string, string>());
}
