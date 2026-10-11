import type { Component } from 'vue';
import {
  Activity,
  Braces,
  CloudDownload,
  Building2,
  Code,
  Download,
  FileText,
  Files,
  Flag,
  Gauge,
  GitCompare,
  History,
  LifeBuoy,
  Link,
  ListChecks,
  MessagesSquare,
  Newspaper,
  Plug,
  RotateCcw,
  Server,
  Settings,
  Tags,
  Trophy,
  Users,
} from 'lucide-vue-next';
import { hasPermission } from '@/lib/permissions';
import type { PermissionHolder, PermissionRule } from '@/lib/permissions';
import { canUseAdmin } from '../admin-access';
import type { AdminAccess, AdminViewer } from '../admin-access';
import { ADMIN_SCREENS, adminRouteName } from '../admin-screens';
import type { AdminScreen, AdminScreenId } from '../admin-screens';

export type AdminNavId = AdminScreenId;
export interface AdminNavItem extends AdminAccess {
  id: AdminNavId;
  labelKey: string;
  icon: Component;
  routeName: string;
  path: string;
}
export interface AdminNavGroup {
  id: 'content' | 'contests' | 'users' | 'site' | 'judging';
  labelKey: string;
  items: AdminNavItem[];
}

const screenItem = (id: AdminScreenId, icon: Component): AdminNavItem => {
  const screen: AdminScreen = ADMIN_SCREENS[id];
  return {
    id,
    labelKey: `admin.shell.screens.${id}`,
    icon,
    routeName: adminRouteName(id),
    path: screen.path,
    permission: screen.permission,
    capability: screen.capability,
  };
};

const group = (id: AdminNavGroup['id'], items: AdminNavItem[]): AdminNavGroup => ({
  id,
  labelKey: `admin.shell.groups.${id}`,
  items,
});

export const ADMIN_NAV: AdminNavGroup[] = [
  group('content', [
    screenItem('problems', FileText),
    screenItem('polygonImport', CloudDownload),
    screenItem('problemImport', Download),
    screenItem('types', Tags),
    screenItem('posts', Newspaper),
    screenItem('commentReports', Flag),
    screenItem('comments', MessagesSquare),
  ]),
  group('contests', [
    screenItem('contests', Trophy),
    screenItem('contestTags', Tags),
    screenItem('similarity', GitCompare),
  ]),
  group('users', [
    screenItem('users', Users),
    screenItem('organizations', Building2),
    screenItem('organizationQuotas', Gauge),
    screenItem('tickets', LifeBuoy),
    screenItem('activity', Activity),
  ]),
  group('site', [
    screenItem('settings', Settings),
    screenItem('config', Braces),
    screenItem('pages', Files),
    screenItem('log', History),
    screenItem('shortLinks', Link),
    screenItem('integrations', Plug),
  ]),
  group('judging', [
    screenItem('judges', Server),
    screenItem('languages', Code),
    screenItem('rejudge', RotateCcw),
    screenItem('submissions', ListChecks),
  ]),
];

export function visibleNav(groups: AdminNavGroup[], user: AdminViewer | null): AdminNavGroup[] {
  return groups
    .map((navGroup) => ({
      ...navGroup,
      items: navGroup.items.filter((item) => canUseAdmin(user, item)),
    }))
    .filter((navGroup) => navGroup.items.length > 0);
}

const isWithin = (basePath: string, routePath: string) =>
  routePath === basePath || routePath.startsWith(`${basePath}/`);
const NAV_PATHS = ADMIN_NAV.flatMap((navGroup) => navGroup.items.map((item) => item.path));
/**
 * An item is current when the route is its page or inside it, unless a longer item path also holds the route:
 * `/admin/organizations/quotas` is the quotas item's, not the organizations item's, and no list of exceptions is needed.
 */
export function isCurrentNav(
  itemPath: string,
  routePath: string,
  navPaths: readonly string[] = NAV_PATHS,
): boolean {
  if (!isWithin(itemPath, routePath)) return false;
  return !navPaths.some((path) => path.length > itemPath.length && isWithin(path, routePath));
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
  section('content', ['problems', 'polygonImport', 'problemImport', 'posts']),
  section('contests', ['contests', 'similarity', 'rejudge', 'submissions', 'judges']),
  section('people', ['users', 'activity', 'settings', 'pages', 'tickets']),
];

export const visibleDashboard = (user: AdminViewer | null) =>
  DASHBOARD_SECTIONS.map((entry) => ({
    ...entry,
    items: entry.items.filter((item) => canUseAdmin(user, item)),
  })).filter((entry) => entry.items.length > 0);

/** The greeting card's three actions; each shows only with its screen's permission. */
export const QUICK_ACTIONS: AdminScreenId[] = ['problemNew', 'polygonImport', 'contestNew'];
