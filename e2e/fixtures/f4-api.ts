import type { OrganizationProblem } from '../../src/api/types/organization-problems';
import type { OrganizationUsage, UsageOverviewRow } from '../../src/api/types/organization-usage';
import type { DeletedProblem } from '../../src/api/types/problem-lifecycle';
import { organizationDetail } from '../../src/test/community-fixtures';
import {
  ORG_PROBLEMS,
  TAGS,
  deletedProblem,
  organizationUsage,
  usageRow,
} from '../../src/test/f4-fixtures';
import type { FakeApi } from './api';
import { list, ok } from './reply';

/** Signs in a member (or an admin) of `lhp` and answers its "Bài tập" list and tag catalogue. */
export function installOrgProblems(
  api: FakeApi,
  options: { canAdminister: boolean; rows?: OrganizationProblem[] },
) {
  api.signedIn = true;
  api.routes['GET /organizations/lhp'] = ok(
    organizationDetail({
      viewer: { isMember: true, canAdminister: options.canAdminister, pendingRequestId: null },
    }),
  );
  api.routes['GET /organizations/lhp/problems'] = list(options.rows ?? ORG_PROBLEMS);
  api.routes['GET /organizations/lhp/problem-tags'] = list(TAGS);
  if (options.canAdminister) api.routes['GET /organizations/lhp/requests'] = list([]);
}

/** Signs in an admin of `lhp` and answers its usage dashboard. */
export function installOrgUsage(api: FakeApi, usage: OrganizationUsage = organizationUsage()) {
  api.signedIn = true;
  api.routes['GET /organizations/lhp'] = ok(
    organizationDetail({
      viewer: { isMember: true, canAdminister: true, pendingRequestId: null },
    }),
  );
  api.routes['GET /organizations/lhp/usage'] = ok(usage);
  api.routes['GET /organizations/lhp/requests'] = list([]);
}

export function installDeletedProblems(api: FakeApi, rows: DeletedProblem[] = [deletedProblem()]) {
  api.routes['GET /problems/deleted'] = list(rows);
}

export function installUsageOverview(api: FakeApi, rows: UsageOverviewRow[] = [usageRow()]) {
  api.routes['GET /organizations/usage'] = list(rows);
  api.routes['GET /organizations/:slug/usage'] = ({ params }) =>
    ok(organizationUsage({ organization: { slug: params.slug, name: params.slug } }));
}
