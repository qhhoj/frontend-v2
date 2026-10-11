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

export const problemEditTarget = (
  user: Viewer,
  problem: { code: string; canEdit: boolean },
): RouteLocationRaw | null =>
  problem.canEdit && open(user, 'problemGeneral')
    ? { name: adminRouteName('problemGeneral'), params: { code: problem.code } }
    : null;

export const contestEditTarget = (
  user: Viewer,
  contest: { key: string; viewer: { canEdit: boolean } },
): RouteLocationRaw | null =>
  contest.viewer.canEdit && open(user, 'contestGeneral')
    ? { name: adminRouteName('contestGeneral'), params: { key: contest.key } }
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
