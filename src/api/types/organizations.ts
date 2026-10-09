import type { Schemas } from '../schemas';
import type { UserSummary } from './problems';

/** backend: apps/api/src/modules/organizations/core/dto/organization.response.ts (OrganizationSummaryResponse) */
export type OrganizationSummary = Schemas['OrganizationSummaryResponse'];
/** backend: organization.response.ts (OrganizationListItemResponse) */
export interface OrganizationListItem extends OrganizationSummary {
  isUnlisted: boolean;
  memberCount: number;
  performancePoints: number;
}
/** backend: organization.response.ts (OrganizationViewerResponse) */
export interface OrganizationViewer {
  isMember: boolean;
  canAdminister: boolean;
  pendingRequestId: string | null;
}
/** backend: organization.response.ts (OrganizationDetailResponse) */
export interface OrganizationDetail extends OrganizationListItem {
  aboutHtml: string;
  about: string | null;
  /** Null: no member cap. */
  slots: number | null;
  logoOverrideImage: string;
  createdAt: string;
  admins: UserSummary[];
  /** Null for anonymous viewers. */
  viewer: OrganizationViewer | null;
}
/** backend: organizations/core/organization-members.repository.ts MEMBER_SORTS */
export const MEMBER_SORTS = ['performancePoints', 'points', 'problemCount', 'rating'] as const;
export type MemberSort = (typeof MEMBER_SORTS)[number];
/** backend: organizations/core/dto/member.response.ts (MemberResponse) */
export interface OrganizationMember {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  displayRank: string;
  points: number;
  performancePoints: number;
  problemCount: number;
  rating: number | null;
}
/** P pending, A approved, R rejected. */
export type JoinRequestState = 'P' | 'A' | 'R';
/** backend: organizations/requests/dto/organization-request.response.ts (OrganizationRequestResponse) */
export interface JoinRequest {
  id: string;
  organizationSlug: string;
  userId: string;
  username: string;
  state: JoinRequestState;
  reason: string;
  createdAt: string;
  /** The deciding admin's user id. */
  decidedBy: string | null;
  decidedAt: string | null;
}
/** backend: libs/database REQUEST_REASON_MAX_LENGTH */
export const JOIN_REASON_MAX_LENGTH = 4096;
/** backend: libs/community MAX_OPEN_ORGANIZATIONS */
export const MAX_OPEN_ORGANIZATIONS = 3;
