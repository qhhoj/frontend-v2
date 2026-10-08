import { apiPage, apiRequest } from './client';
import type { PostListItem } from './types/blog';
import type {
  JoinRequest,
  JoinRequestState,
  MemberSort,
  OrganizationDetail,
  OrganizationListItem,
  OrganizationMember,
} from './types/organizations';

/** The backend's largest page (`OrganizationListQueryDto`). */
const ORGANIZATION_PAGE_SIZE = 100;
const organizationPath = (slug: string) => `/organizations/${encodeURIComponent(slug)}`;
const isJoinable = (organization: OrganizationListItem) =>
  organization.isOpen && !organization.isUnlisted;

export interface MemberQuery {
  sort: MemberSort;
  page: number;
  pageSize: number;
}

export const fetchOrganizations = (page: number) =>
  apiPage<OrganizationListItem>('/organizations', {
    query: { page, pageSize: ORGANIZATION_PAGE_SIZE },
  });
export const fetchOrganization = (slug: string) =>
  apiRequest<OrganizationDetail>(organizationPath(slug));
export const fetchMembers = (slug: string, query: MemberQuery) =>
  apiPage<OrganizationMember>(`${organizationPath(slug)}/members`, { query: { ...query } });
export const fetchOrganizationPosts = (slug: string, page: number) =>
  apiPage<PostListItem>(`${organizationPath(slug)}/posts`, { query: { page } });
export const joinOrganization = (slug: string) =>
  apiRequest<void>(`${organizationPath(slug)}/join`, { method: 'POST' });
export const leaveOrganization = (slug: string) =>
  apiRequest<void>(`${organizationPath(slug)}/leave`, { method: 'POST' });
export const requestToJoin = (slug: string, reason: string) =>
  apiRequest<JoinRequest>(`${organizationPath(slug)}/requests`, {
    method: 'POST',
    body: { reason },
  });
export const fetchJoinRequest = (slug: string, id: string) =>
  apiRequest<JoinRequest>(`${organizationPath(slug)}/requests/${encodeURIComponent(id)}`);
export const fetchJoinRequests = (slug: string, state: JoinRequestState, page: number) =>
  apiPage<JoinRequest>(`${organizationPath(slug)}/requests`, { query: { state, page } });
export const decideJoinRequest = (slug: string, id: string, state: 'A' | 'R') =>
  apiRequest<JoinRequest>(`${organizationPath(slug)}/requests/${encodeURIComponent(id)}/decide`, {
    method: 'POST',
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
