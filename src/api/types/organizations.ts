import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';

/** backend: apps/api/src/modules/organizations/core/dto/organization.response.ts (OrganizationSummaryResponse) */
export type OrganizationSummary = Schemas['OrganizationSummaryResponse'];
/** backend: organization.response.ts (OrganizationListItemResponse) */
export type OrganizationListItem = Schemas['OrganizationListItemResponse'];
/** backend: organization.response.ts (OrganizationViewerResponse) */
export type OrganizationViewer = Schemas['OrganizationViewerResponse'];
/** backend: organization.response.ts (OrganizationDetailResponse) */
export type OrganizationDetail = Schemas['OrganizationDetailResponse'];
export type MemberSort = NonNullable<QueryOf<'/organizations/{slug}/members'>['sort']>;
/** backend: organizations/core/organization-members.repository.ts MEMBER_SORTS */
export const MEMBER_SORTS = [
  'performancePoints',
  'points',
  'problemCount',
  'rating',
] as const satisfies readonly MemberSort[];
/** backend: organizations/core/dto/member.response.ts (MemberResponse) */
export type OrganizationMember = Schemas['MemberResponse'];
/** P pending, A approved, R rejected. */
export type JoinRequestState = Schemas['OrganizationRequestState'];
/** backend: organizations/requests/dto/organization-request.response.ts (OrganizationRequestResponse) */
export type JoinRequest = Schemas['OrganizationRequestResponse'];
/** backend: libs/database REQUEST_REASON_MAX_LENGTH */
export const JOIN_REASON_MAX_LENGTH = 4096;
/** backend: libs/community MAX_OPEN_ORGANIZATIONS */
export const MAX_OPEN_ORGANIZATIONS = 3;
