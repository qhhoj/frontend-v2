import { apiGetPage, apiSend } from './typed';
import type { JsonBodyOf, QueryOf } from './typed';
import type { JoinRequestState } from './types/organizations';

/** The write body of `POST /organizations` and `PATCH /organizations/:slug`; the staff fields need `judge.edit_all_organization`. */
export type OrganizationBody = JsonBodyOf<'/organizations', 'post'>;

export const createOrganization = (body: OrganizationBody) =>
  apiSend('post', '/organizations', { body });

export const updateOrganization = (slug: string, patch: Partial<OrganizationBody>) =>
  apiSend('patch', '/organizations/{slug}', { path: { slug }, body: patch });

export const kickMember = (slug: string, userId: string) =>
  apiSend('post', '/organizations/{slug}/kick', { path: { slug }, body: { userId } });

/** Backend `OrganizationRequestQueueController` (`judge.edit_all_organization`): every organization's requests, newest first; `search` matches the requester's username or the organization. */
export const fetchAllJoinRequests = (state: JoinRequestState, page: number, search = '') =>
  apiGetPage('/admin/organization-requests', {
    query: { state, page, ...(search ? { search } : {}) },
  });

export type OrganizationListFilters = Pick<QueryOf<'/organizations'>, 'open' | 'unlisted'>;

/** The admin list: the public `GET /organizations` with its state filters, narrowed to the organizations the viewer may administer (all of them with `edit_all_organization`). */
export const fetchAdminOrganizations = (
  page: number,
  search: string,
  filters: OrganizationListFilters,
) =>
  apiGetPage('/organizations', {
    query: { page, pageSize: 50, ...(search ? { search } : {}), ...filters, administered: true },
  });

/** Creates, edits and member removals, newest first (20 per page); administrators only. */
export const fetchOrganizationHistory = (slug: string, page: number) =>
  apiGetPage('/organizations/{slug}/revisions', { path: { slug }, query: { page } });

/** Staff (`judge.edit_all_organization`): queues the recompute of points and member count. */
export const recalculateOrganization = (slug: string) =>
  apiSend('post', '/organizations/{slug}/recalculate', { path: { slug } });
