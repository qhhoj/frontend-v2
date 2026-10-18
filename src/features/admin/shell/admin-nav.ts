import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import {
  Activity,
  CloudDownload,
  Download,
  Building2,
  Code,
  FileText,
  Files,
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
  Tag,
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
  /** The screen's path: the item is current on it and on every page below it. */
  path: string;
  /** Further sections the item stands for (the comments item: every comment and the locked pages beside the reports). */
  alsoPaths: readonly string[];
}
/** P-35 A: by object, the rare screens under "Công cụ" (last, folded until opened). Breadcrumbs read the same groups. */
export interface AdminNavGroup {
  id: 'problems' | 'contests' | 'judging' | 'community' | 'users' | 'system' | 'tools';
  labelKey: string;
  items: AdminNavItem[];
}

interface ItemOptions {
  /** A nav label other than the screen title. */
  labelKey?: string;
  alsoPaths?: readonly string[];
}

const screenItem = (
  id: AdminScreenId,
  icon: Component,
  options: ItemOptions = {},
): AdminNavItem => {
  const screen: AdminScreen = ADMIN_SCREENS[id];
  return {
    id,
    labelKey: options.labelKey ?? `admin.shell.screens.${id}`,
    icon,
    routeName: adminRouteName(id),
    path: screen.path,
    alsoPaths: options.alsoPaths ?? [],
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
  ]),
  group('contests', [screenItem('contests', Trophy)]),
  group('judging', [
    screenItem('submissions', ListChecks, { labelKey: 'admin.shell.nav.submissions' }),
    screenItem('judges', Server),
    screenItem('languages', Code),
  ]),
  group('community', [
    screenItem('tickets', LifeBuoy),
    // One "Bình luận" item for the three tabs, opening on the reports queue.
    screenItem('commentReports', MessagesSquare, {
      labelKey: 'admin.shell.nav.comments',
      alsoPaths: [ADMIN_SCREENS.comments.path, ADMIN_SCREENS.commentLocks.path],
    }),
    screenItem('posts', Newspaper),
  ]),
  group('users', [screenItem('users', Users), screenItem('organizations', Building2)]),
  group('system', [
    screenItem('settings', Settings, { labelKey: 'admin.shell.nav.settings' }),
    screenItem('log', History, { labelKey: 'admin.shell.nav.log' }),
  ]),
  group('tools', [
    screenItem('types', Tags, { labelKey: 'admin.shell.nav.types' }),
    screenItem('contestTags', Tag),
    screenItem('similarity', GitCompare),
    screenItem('rejudge', RotateCcw),
    screenItem('pages', Files),
    screenItem('shortLinks', Link),
    screenItem('integrations', Plug),
    screenItem('activity', Activity),
  ]),
];

/** Screens without a nav item of their own (a tab or a section of one) that Ctrl+K still finds by name. */
export const PALETTE_ONLY_SCREENS: readonly AdminNavItem[] = [
  screenItem('comments', MessagesSquare),
  screenItem('commentLocks', MessagesSquare),
  screenItem('organizationQuotas', Building2),
  screenItem('cannedReplies', LifeBuoy),
];

/** Every screen Ctrl+K lists, nav items first. */
export const PALETTE_SCREENS: readonly AdminNavItem[] = [
  ...ADMIN_NAV.flatMap((navGroup) => navGroup.items),
  ...PALETTE_ONLY_SCREENS,
];

/** The groups folded until the viewer opens them: the rare tools. */
export const FOLDED_BY_DEFAULT: readonly AdminNavGroup['id'][] = ['tools'];

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
const pathsOf = (item: AdminNavItem) => [item.path, ...item.alsoPaths];
const NAV_PATHS = ADMIN_NAV.flatMap((navGroup) => navGroup.items.flatMap(pathsOf));
/**
 * An item is current when the route is its page or inside it, unless a longer item path also holds the route:
 * `/admin/problems/polygon` is the Polygon import item's, not the problems item's, and no list of exceptions is needed.
 */
export function isCurrentNav(
  itemPath: string,
  routePath: string,
  navPaths: readonly string[] = NAV_PATHS,
): boolean {
  if (!isWithin(itemPath, routePath)) return false;
  return !navPaths.some((path) => path.length > itemPath.length && isWithin(path, routePath));
}

/** Whether the item stands for the route: its screen or one of its further sections, or a page below them. */
export const isCurrentItem = (item: AdminNavItem, routePath: string): boolean =>
  pathsOf(item).some((path) => isCurrentNav(path, routePath));

/** The nav group and item that hold a route path; `null` outside the nav (the dashboard). */
export function navPlaceOf(routePath: string): { group: AdminNavGroup; item: AdminNavItem } | null {
  for (const navGroup of ADMIN_NAV) {
    const item = navGroup.items.find((entry) => isCurrentItem(entry, routePath));
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
  if (pathsOf(place.item).includes(routePath)) return [groupCrumb];
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

/** The greeting card's three actions; each shows only with its screen's permission. */
export const QUICK_ACTIONS: AdminScreenId[] = ['problemNew', 'polygonImport', 'contestNew'];
