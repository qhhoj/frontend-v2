import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
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
  id: 'problems' | 'contests' | 'judging' | 'community' | 'users' | 'site';
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
  group('problems', [
    screenItem('problems', FileText),
    screenItem('polygonImport', CloudDownload),
    screenItem('problemImport', Download),
    screenItem('types', Tags),
  ]),
  group('contests', [
    screenItem('contests', Trophy),
    screenItem('contestTags', Tags),
    screenItem('similarity', GitCompare),
  ]),
  group('judging', [
    screenItem('submissions', ListChecks),
    screenItem('rejudge', RotateCcw),
    screenItem('judges', Server),
    screenItem('languages', Code),
  ]),
  group('community', [
    screenItem('posts', Newspaper),
    screenItem('commentReports', Flag),
    screenItem('comments', MessagesSquare),
    screenItem('tickets', LifeBuoy),
  ]),
  group('users', [
    screenItem('users', Users),
    screenItem('organizations', Building2),
    screenItem('organizationQuotas', Gauge),
    screenItem('activity', Activity),
  ]),
  group('site', [
    screenItem('settings', Settings),
    screenItem('config', Braces),
    screenItem('pages', Files),
    screenItem('shortLinks', Link),
    screenItem('integrations', Plug),
    screenItem('log', History),
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

/** The nav group and item that hold a route path; `null` outside the nav (the dashboard). */
export function navPlaceOf(routePath: string): { group: AdminNavGroup; item: AdminNavItem } | null {
  for (const navGroup of ADMIN_NAV) {
    const item = navGroup.items.find((entry) => isCurrentNav(entry.path, routePath));
    if (item) return { group: navGroup, item };
  }
  return null;
}

export interface AdminCrumb {
  label: string;
  to?: RouteLocationRaw;
  /** A code or key, set in monospace. */
  mono?: boolean;
}

/**
 * Every admin header's leading crumbs, taken from the nav so they always match it: the group, then the screen as a link
 * when the page sits below it (an editor, a create form). A group named like its screen ("Contests / Contests") shows once.
 */
export function navCrumbsOf(routePath: string, translate: (key: string) => string): AdminCrumb[] {
  const place = navPlaceOf(routePath);
  if (!place) return [];
  const groupCrumb: AdminCrumb = { label: translate(place.group.labelKey) };
  if (routePath === place.item.path) return [groupCrumb];
  const screenCrumb = { label: translate(place.item.labelKey), to: { name: place.item.routeName } };
  return groupCrumb.label === screenCrumb.label ? [screenCrumb] : [groupCrumb, screenCrumb];
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
  section('people', ['users', 'organizations', 'activity', 'settings', 'pages', 'tickets']),
];

export const visibleDashboard = (user: AdminViewer | null) =>
  DASHBOARD_SECTIONS.map((entry) => ({
    ...entry,
    items: entry.items.filter((item) => canUseAdmin(user, item)),
  })).filter((entry) => entry.items.length > 0);

/** The greeting card's three actions; each shows only with its screen's permission. */
export const QUICK_ACTIONS: AdminScreenId[] = ['problemNew', 'polygonImport', 'contestNew'];
