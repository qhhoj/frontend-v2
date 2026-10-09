import { apiGet, apiGetPage, apiSend } from './typed';
import type { QueryOf } from './typed';
import type { JoinRequestState, OrganizationListItem } from './types/organizations';

/** The backend's largest page (`OrganizationListQueryDto`). */
const ORGANIZATION_PAGE_SIZE = 100;
const isJoinable = (organization: OrganizationListItem) =>
  organization.isOpen && !organization.isUnlisted;

export type MemberQuery = Required<QueryOf<'/organizations/{slug}/members'>>;

/** `search` is a literal, case-insensitive substring over name, short name and slug; blank (after trimming) sends nothing. */
export const fetchOrganizations = (page: number, search?: string) =>
  apiGetPage('/organizations', {
    query: { page, pageSize: ORGANIZATION_PAGE_SIZE, search: search?.trim() },
  });
export const fetchOrganization = (slug: string) =>
  apiGet('/organizations/{slug}', { path: { slug } });
export const fetchMembers = (slug: string, query: MemberQuery) =>
  apiGetPage('/organizations/{slug}/members', { path: { slug }, query });
export const fetchOrganizationPosts = (slug: string, page: number) =>
  apiGetPage('/organizations/{slug}/posts', { path: { slug }, query: { page } });
export const joinOrganization = (slug: string) =>
  apiSend('post', '/organizations/{slug}/join', { path: { slug } });
export const leaveOrganization = (slug: string) =>
  apiSend('post', '/organizations/{slug}/leave', { path: { slug } });
export const requestToJoin = (slug: string, reason: string) =>
  apiSend('post', '/organizations/{slug}/requests', { path: { slug }, body: { reason } });
export const fetchJoinRequest = (slug: string, id: string) =>
  apiGet('/organizations/{slug}/requests/{id}', { path: { slug, id } });
export const fetchJoinRequests = (slug: string, state: JoinRequestState, page: number) =>
  apiGetPage('/organizations/{slug}/requests', { path: { slug }, query: { state, page } });
export const decideJoinRequest = (slug: string, id: string, state: 'A' | 'R') =>
  apiSend('post', '/organizations/{slug}/requests/{id}/decide', {
    path: { slug, id },
    body: { state },
  });

/**
 * The organizations a signup may join: open and listed (registration refuses any other with `organization_unavailable`).
 * The list is sorted by name and has no `open` filter (ask A2), so every page is read and filtered here.
 */
export async function fetchOpenOrganizations(): Promise<OrganizationListItem[]> {
  const joinable: OrganizationListItem[] = [];
  for (let pageNumber = 1; ; pageNumber += 1) {
    const { items, meta } = await fetchOrganizations(pageNumber);
    joinable.push(...items.filter(isJoinable));
    if (pageNumber * ORGANIZATION_PAGE_SIZE >= (meta.total ?? 0)) return joinable;
  }
}
