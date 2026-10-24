import type { RouteLocationRaw } from 'vue-router';
import { allowsAny } from '@/lib/permissions';
import { canUseAdmin } from '../admin-access';
import type { AdminViewer } from '../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import type { AdminScreenId } from '../admin-screens';

/**
 * Where a public page's "Edit in admin" link goes, or null when the viewer must not see it. Rule: the object's own
 * `canEdit`-style flag from the API where one exists, plus the permission that opens the admin screen (the router
 * would turn the viewer away otherwise). Types without a flag use the screen's coarse permission alone.
 */
type Viewer = AdminViewer | null;
const EDIT_ANY_ORGANIZATION = 'judge.edit_all_organization';
const open = (user: Viewer, screen: AdminScreenId) => canUseAdmin(user, ADMIN_SCREENS[screen]);

/** The public problem page's tabs, each with the editor tab that edits what is on screen. */
const PROBLEM_SECTION_SCREENS = {
  statement: 'problemStatements',
  editorial: 'problemEditorial',
} as const satisfies Record<string, AdminScreenId>;
export type ProblemSection = keyof typeof PROBLEM_SECTION_SCREENS;

/** The pencil opens the editor tab of the section being read: the statement's text, or the editorial. */
export function problemEditTarget(
  user: Viewer,
  problem: { code: string; canEdit: boolean },
  section: ProblemSection = 'statement',
): RouteLocationRaw | null {
  const screen = PROBLEM_SECTION_SCREENS[section];
  return problem.canEdit && open(user, screen)
    ? { name: adminRouteName(screen), params: { code: problem.code } }
    : null;
}

/** The contest editor tabs a public contest page can link to: the one matching what is on screen. */
export type ContestEditScreen = Extract<
  AdminScreenId,
  'contestGeneral' | 'contestProblems' | 'contestRanking' | 'contestAnnouncements'
>;

export const contestEditTarget = (
  user: Viewer,
  contest: { key: string; viewer: { canEdit: boolean } },
  screen: ContestEditScreen = 'contestGeneral',
): RouteLocationRaw | null =>
  contest.viewer.canEdit && open(user, screen)
    ? { name: adminRouteName(screen), params: { key: contest.key } }
    : null;

/** Organization admins already have the public Manage tab; only site staff who edit any organization get the link. */
export const organizationEditTarget = (
  user: Viewer,
  organization: { slug: string; viewer: { canAdminister: boolean } | null },
): RouteLocationRaw | null =>
  organization.viewer?.canAdminister && allowsAny(user, EDIT_ANY_ORGANIZATION)
    ? { name: adminRouteName('organizations'), query: { org: organization.slug } }
    : null;

/** No per-user flag: `ban_user` opens the admin user panel. Not on yourself (the backend refuses most edits there). */
export const userEditTarget = (
  user: (AdminViewer & { username: string }) | null,
  username: string,
): RouteLocationRaw | null =>
  user?.username !== username && open(user, 'users')
    ? { name: adminRouteName('users'), query: { user: username } }
    : null;

/** No per-page flag and the public page carries no id: the flatpage list, for holders of `change_flatpage`. */
export const flatpageEditTarget = (user: Viewer): RouteLocationRaw | null =>
  open(user, 'pages') ? { name: adminRouteName('pages') } : null;

/** No per-runtime flag: `change_judge` opens the admin judge list. */
export const judgesEditTarget = (user: Viewer): RouteLocationRaw | null =>
  open(user, 'judges') ? { name: adminRouteName('judges') } : null;
