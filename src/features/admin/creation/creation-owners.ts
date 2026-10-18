import { useQuery } from '@tanstack/vue-query';
import { computed } from 'vue';
import { fetchCreationOrganizations } from '@/api/organizations-admin.api';
import type { OrganizationListItem } from '@/api/types/organizations';
import { useViewerId } from '@/stores/use-viewer-id';
import { useCreationScope } from './creation-scope';
import type { CreationKind } from './creation-scope';

/** Who owns a new problem or contest: an organization the viewer may create it in, or `null` for the site. */
export type CreationOwner = Pick<
  OrganizationListItem,
  'slug' | 'name' | 'shortName' | 'problemCodePrefix'
>;

/**
 * The organizations the viewer may create this kind in, as `GET /organizations?canCreate=<kind>` lists them (the backend
 * decides: an administrator holding the create right). Idle for a viewer whose session has no organization scope; its
 * `kind` is in the key, as a problem list is not a contest list.
 */
export function useCreationOwnersQuery(kind: CreationKind) {
  const viewer = useViewerId();
  const { scope } = useCreationScope(kind);
  return useQuery({
    queryKey: computed(() => ['organizations', 'creation', kind, viewer.value]),
    queryFn: () => fetchCreationOrganizations(kind),
    enabled: computed(() => scope.value.organizations),
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
