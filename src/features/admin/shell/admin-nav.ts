import type { Component } from 'vue';
import {
  Activity,
  Braces,
  Building2,
  Code,
  Download,
  FileText,
  Files,
  GitCompare,
  History,
  LifeBuoy,
  ListChecks,
  Menu,
  Newspaper,
  RotateCcw,
  Server,
  Settings,
  Tags,
  Trophy,
  Users,
} from 'lucide-vue-next';
import { allowsAny, hasPermission } from '@/lib/permissions';
import type { PermissionHolder, PermissionRule } from '@/lib/permissions';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import type { AdminScreenId } from '../admin-screens';

export type AdminNavId = AdminScreenId | 'submissions';
export interface AdminNavItem {
  id: AdminNavId;
  labelKey: string;
  icon: Component;
  routeName: string;
  path: string;
  permission: PermissionRule | null;
}
export interface AdminNavGroup {
  id: 'content' | 'contests' | 'users' | 'site' | 'judging';
  labelKey: string;
  items: AdminNavItem[];
}

const screenItem = (id: AdminScreenId, icon: Component): AdminNavItem => ({
  id,
  labelKey: `admin.shell.screens.${id}`,
  icon,
  routeName: adminRouteName(id),
  path: ADMIN_SCREENS[id].path,
  permission: ADMIN_SCREENS[id].permission,
});

/** "Bài nộp" opens the public list: staff controls live on each submission page (board SubmissionStaff). */
const SUBMISSIONS_ITEM: AdminNavItem = {
  id: 'submissions',
  labelKey: 'admin.shell.screens.submissions',
  icon: ListChecks,
  routeName: 'submissions',
  path: '/submissions',
  permission: ['judge.rejudge_submission', 'judge.reject_submission', 'judge.abort_any_submission'],
};

const group = (id: AdminNavGroup['id'], items: AdminNavItem[]): AdminNavGroup => ({
  id,
  labelKey: `admin.shell.groups.${id}`,
  items,
});

export const ADMIN_NAV: AdminNavGroup[] = [
  group('content', [
    screenItem('problems', FileText),
    screenItem('problemImport', Download),
    screenItem('types', Tags),
    screenItem('posts', Newspaper),
  ]),
  group('contests', [screenItem('contests', Trophy), screenItem('similarity', GitCompare)]),
  group('users', [
    screenItem('users', Users),
    screenItem('organizations', Building2),
    screenItem('tickets', LifeBuoy),
    screenItem('activity', Activity),
  ]),
  group('site', [
    screenItem('settings', Settings),
    screenItem('config', Braces),
    screenItem('nav', Menu),
    screenItem('pages', Files),
    screenItem('log', History),
  ]),
  group('judging', [
    screenItem('judges', Server),
    screenItem('languages', Code),
    screenItem('rejudge', RotateCcw),
    SUBMISSIONS_ITEM,
  ]),
];

export function visibleNav(
  groups: AdminNavGroup[],
  user: PermissionHolder | null,
): AdminNavGroup[] {
  return groups
    .map((navGroup) => ({
      ...navGroup,
      items: navGroup.items.filter((item) => allowsAny(user, item.permission)),
    }))
    .filter((navGroup) => navGroup.items.length > 0);
}

/** The most specific item wins: `/admin/problems/import` is not inside `/admin/problems` (it has its own item). */
const SPECIFIC_PATHS = ['/admin/problems/import'];
export function isCurrentNav(itemPath: string, routePath: string): boolean {
  if (routePath === itemPath) return true;
  const isInside = routePath.startsWith(`${itemPath}/`);
  return (
    isInside && !SPECIFIC_PATHS.some((path) => path !== itemPath && routePath.startsWith(path))
  );
}

/** The first permission of a rule that this viewer holds: a card names what the viewer can use, never a permission they lack. */
export function heldPermission(
  rule: PermissionRule | null,
  user: PermissionHolder | null,
): string | null {
  if (rule === null) return null;
  const permissions = typeof rule === 'string' ? [rule] : rule;
  return permissions.find((permission) => hasPermission(user, permission)) ?? null;
}

interface DashboardSection {
  labelKey: string;
  items: AdminNavItem[];
}
const itemById = (id: AdminNavId) =>
  ADMIN_NAV.flatMap((navGroup) => navGroup.items).find((item) => item.id === id)!;
const section = (key: string, ids: AdminNavId[]): DashboardSection => ({
  labelKey: `admin.shell.dashboard.sections.${key}`,
  items: ids.map(itemById),
});

/** Board AdminShell: three sections of quick-link cards. */
export const DASHBOARD_SECTIONS: DashboardSection[] = [
  section('content', ['problems', 'problemImport', 'posts']),
  section('contests', ['contests', 'similarity', 'rejudge', 'judges']),
  section('people', ['users', 'activity', 'settings', 'nav', 'pages', 'tickets']),
];

export const visibleDashboard = (user: PermissionHolder | null) =>
  DASHBOARD_SECTIONS.map((entry) => ({
    ...entry,
    items: entry.items.filter((item) => allowsAny(user, item.permission)),
  })).filter((entry) => entry.items.length > 0);

/** The greeting card's three actions; each shows only with its screen's permission. */
export const QUICK_ACTIONS: AdminScreenId[] = ['problemNew', 'problemImport', 'contestNew'];
