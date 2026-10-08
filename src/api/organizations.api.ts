import { apiPage } from './client';
import type { OrganizationListItem } from './types/organizations';

/** The backend's largest page (`OrganizationListQueryDto`). */
const ORGANIZATION_PAGE_SIZE = 100;
const isJoinable = (organization: OrganizationListItem) =>
  organization.isOpen && !organization.isUnlisted;

/**
 * The organizations a signup may join: open and listed (registration refuses any other with `organization_unavailable`).
 * The list is sorted by name and has no `open` filter (ask A2), so every page is read and filtered here.
 */
export async function fetchOpenOrganizations(): Promise<OrganizationListItem[]> {
  const joinable: OrganizationListItem[] = [];
  for (let pageNumber = 1; ; pageNumber += 1) {
    const { items, meta } = await apiPage<OrganizationListItem>('/organizations', {
      query: { page: pageNumber, pageSize: ORGANIZATION_PAGE_SIZE },
    });
    joinable.push(...items.filter(isJoinable));
    if (pageNumber * ORGANIZATION_PAGE_SIZE >= (meta.total ?? 0)) return joinable;
  }
}
