import type { OrganizationDetail } from '@/api/types/organizations';
import type { OrganizationProblem } from '@/api/types/organization-problems';
import type { OrganizationUsage } from '@/api/types/organization-usage';
import type { DeletedProblem } from '@/api/types/problem-lifecycle';
import { organizationDetail } from './community-fixtures';
import { organizationRoutes } from './community-routes';
import { ORG_PROBLEMS, TAGS, deletedProblem, organizationUsage } from './f4-fixtures';
import { ok, page } from './mock-api';

type ViewerState = NonNullable<OrganizationDetail['viewer']>;
export const ADMIN_STATE: ViewerState = {
  isMember: true,
  canAdminister: true,
  pendingRequestId: null,
};
export const MEMBER_STATE: ViewerState = {
  isMember: true,
  canAdminister: false,
  pendingRequestId: null,
};
export const STRANGER_STATE: ViewerState = {
  isMember: false,
  canAdminister: false,
  pendingRequestId: null,
};

/** The org layout of `lhp` for a viewer, its "Bài tập" rows and its tag catalogue. */
export const orgProblemRoutes = (
  viewer: ViewerState = ADMIN_STATE,
  rows: OrganizationProblem[] = ORG_PROBLEMS,
) => ({
  ...organizationRoutes(organizationDetail({ viewer })),
  'GET /organizations/lhp/problems': page(rows),
  'GET /organizations/lhp/problem-tags': page(TAGS, { pageSize: 100 }),
});

/** The org layout of `lhp` and its usage dashboard. */
export const orgUsageRoutes = (
  usage: OrganizationUsage = organizationUsage(),
  viewer: ViewerState = ADMIN_STATE,
) => ({
  ...organizationRoutes(organizationDetail({ viewer })),
  'GET /organizations/lhp/usage': ok(usage),
});

export const deletedListRoutes = (rows: DeletedProblem[] = [deletedProblem()]) => ({
  'GET /problems/deleted': page(rows),
});
