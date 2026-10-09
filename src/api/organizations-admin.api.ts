import { apiPage, apiRequest } from './client';
import type { JoinRequest, JoinRequestState, OrganizationDetail } from './types/organizations';

/** The write body of `POST /organizations` and `PATCH /organizations/:slug`; the staff fields need `judge.edit_all_organization`. */
export interface OrganizationBody {
  name: string;
  slug: string;
  about?: string;
  isOpen?: boolean;
  logoOverrideImage?: string;
  adminIds?: string[];
  isUnlisted?: boolean;
  slots?: number | null;
  shortName?: string;
}

const organizationPath = (slug: string) => `/organizations/${encodeURIComponent(slug)}`;

export const createOrganization = (body: OrganizationBody) =>
  apiRequest<OrganizationDetail>('/organizations', { method: 'POST', body });

export const updateOrganization = (slug: string, patch: Partial<OrganizationBody>) =>
  apiRequest<OrganizationDetail>(organizationPath(slug), { method: 'PATCH', body: patch });

export const kickMember = (slug: string, userId: string) =>
  apiRequest<void>(`${organizationPath(slug)}/kick`, { method: 'POST', body: { userId } });

/** Backend `OrganizationRequestQueueController` (`judge.edit_all_organization`): every organization's requests, newest first. */
export const fetchAllJoinRequests = (state: JoinRequestState, page: number) =>
  apiPage<JoinRequest>('/admin/organization-requests', { query: { state, page } });
