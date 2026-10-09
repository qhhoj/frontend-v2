import { apiGetPage, apiSend } from './typed';
import type { JsonBodyOf } from './typed';
import type { JoinRequestState } from './types/organizations';

/** The write body of `POST /organizations` and `PATCH /organizations/:slug`; the staff fields need `judge.edit_all_organization`. */
export type OrganizationBody = JsonBodyOf<'/organizations', 'post'>;

export const createOrganization = (body: OrganizationBody) =>
  apiSend('post', '/organizations', { body });

export const updateOrganization = (slug: string, patch: Partial<OrganizationBody>) =>
  apiSend('patch', '/organizations/{slug}', { path: { slug }, body: patch });

export const kickMember = (slug: string, userId: string) =>
  apiSend('post', '/organizations/{slug}/kick', { path: { slug }, body: { userId } });

/** Backend `OrganizationRequestQueueController` (`judge.edit_all_organization`): every organization's requests, newest first. */
export const fetchAllJoinRequests = (state: JoinRequestState, page: number) =>
  apiGetPage('/admin/organization-requests', { query: { state, page } });
