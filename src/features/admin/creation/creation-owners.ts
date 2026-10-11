import { useQuery } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { fetchAdminOrganizations } from '@/api/organizations-admin.api';
import type { OrganizationListItem } from '@/api/types/organizations';
import { useViewerId } from '@/stores/use-viewer-id';

/** Who owns a new problem or contest: an organization the viewer administers, or `null` for the site. */
export type CreationOwner = Pick<
  OrganizationListItem,
  'slug' | 'name' | 'shortName' | 'problemCodePrefix'
>;

/** The organizations the viewer may create for: the ones they administer (the backend refuses the rest). */
export function useCreationOwnersQuery(enabled: MaybeRefOrGetter<boolean>) {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => ['organizations', 'administered', 'creation', viewer.value]),
    queryFn: async () => (await fetchAdminOrganizations(1, '', {})).items,
    enabled: computed(() => toValue(enabled)),
    staleTime: 60_000,
  });
}

/**
 * The owner a create form starts with: the organization named in the link (`?organization=<slug>`), else the only or first
 * organization for a viewer who cannot create site-wide, else the site (`null`).
 */
export function initialOwner(
  owners: readonly CreationOwner[],
  requestedSlug: string | null,
  canCreateSiteWide: boolean,
): CreationOwner | null {
  const requested = owners.find((owner) => owner.slug === requestedSlug);
  if (requested) return requested;
  return canCreateSiteWide ? null : (owners[0] ?? null);
}
