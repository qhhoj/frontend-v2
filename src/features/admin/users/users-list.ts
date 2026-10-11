import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import { BAN_REASON_MAX_LENGTH } from '@/api/types/users';
import type { UserPage } from '@/api/types/users';
import type { StaffUser, StaffUserQuery } from '@/api/types/users-admin';
import { STAFF_USERS_PAGE_SIZE } from '@/api/users-admin.api';
import { pageFromQuery } from '@/lib/paging';

export { BAN_REASON_MAX_LENGTH };
/** The backend refuses deeper pages (skipping is linear in the page number). */
export const STAFF_USERS_MAX_PAGE = 500;

export const lastStaffPage = (total: number, pageSize: number = STAFF_USERS_PAGE_SIZE) =>
  Math.min(STAFF_USERS_MAX_PAGE, Math.max(1, Math.ceil(total / pageSize)));

/**
 * Only a superuser may start an impersonation, and never of another superuser, an inactive (never activated) or a banned account. Unknown staff facts
 * (`staff` null) refuse too: the superuser status of the target is then not known, and the backend refuses it anyway.
 */
export const canImpersonate = (viewerIsSuperuser: boolean, page: UserPage) =>
  viewerIsSuperuser &&
  page.staff !== null &&
  !page.staff.isSuperuser &&
  page.staff.isActive &&
  page.staff.banReason === null &&
  page.displayRank !== 'banned';

/** Why a ban reason cannot be sent, or null: the reason is required and at most `BAN_REASON_MAX_LENGTH` characters. */
export const banReasonProblem = (reason: string): 'required' | 'tooLong' | null => {
  const text = reason.trim();
  if (text === '') return 'required';
  return text.length > BAN_REASON_MAX_LENGTH ? 'tooLong' : null;
};

export const USERS_TABS = ['all', 'active', 'banned'] as const;
export type UsersTab = (typeof USERS_TABS)[number];
/** The backend's `Length(1, 64)` on `search`. */
export const USER_SEARCH_MAX_LENGTH = 64;

export const USERS_SORTS = ['default', 'lastAccess', '-lastAccess'] as const;
export type UsersSort = (typeof USERS_SORTS)[number];

export interface UsersListView {
  tab: UsersTab;
  sort: UsersSort;
  search: string;
  page: number;
}

const BANNED_OF_TAB: Record<UsersTab, boolean | undefined> = {
  all: undefined,
  active: false,
  banned: true,
};

const singleText = (value: unknown): string => {
  const single = Array.isArray(value) ? value[0] : value;
  return typeof single === 'string' ? single : '';
};

export function usersViewFromQuery(query: LocationQuery): UsersListView {
  const tab = singleText(query.tab);
  const sort = singleText(query.sort);
  return {
    tab: USERS_TABS.find((candidate) => candidate === tab) ?? 'all',
    sort: USERS_SORTS.find((candidate) => candidate === sort) ?? 'default',
    search: singleText(query.q).trim().slice(0, USER_SEARCH_MAX_LENGTH),
    page: Math.min(pageFromQuery(query.page), STAFF_USERS_MAX_PAGE),
  };
}

/** The tabs of the user drawer, in order; `?section=` names the open one (the first when absent or unknown). */
export const USER_SECTIONS = ['profile', 'access', 'security', 'account'] as const;
export type UserSection = (typeof USER_SECTIONS)[number];

export const userSectionOf = (query: LocationQuery): UserSection | null => {
  const section = singleText(query.section);
  return USER_SECTIONS.find((candidate) => candidate === section) ?? null;
};

/** Defaults are left out so the plain list keeps the plain URL; `user` and `section` (the open drawer) are not filters and survive. */
export function usersViewToQuery(view: UsersListView, current: LocationQuery): LocationQueryRaw {
  const query: LocationQueryRaw = {};
  const user = singleText(current.user);
  if (user) query.user = user;
  const section = userSectionOf(current);
  if (user && section) query.section = section;
  if (view.tab !== 'all') query.tab = view.tab;
  if (view.sort !== 'default') query.sort = view.sort;
  if (view.search) query.q = view.search;
  if (view.page > 1) query.page = String(view.page);
  return query;
}

export function staffUsersQueryOf(view: UsersListView): StaffUserQuery {
  const query: StaffUserQuery = { page: view.page };
  const banned = BANNED_OF_TAB[view.tab];
  if (banned !== undefined) query.banned = banned;
  if (view.sort !== 'default') query.sort = view.sort;
  if (view.search.trim()) query.search = view.search.trim();
  return query;
}

export type UserStatus = 'banned' | 'inactive' | 'active';

/** Banned wins over inactive: a ban also deactivates, and the tab filter reads `banReason`. */
export const userStatusOf = (user: Pick<StaffUser, 'banReason' | 'isActive'>): UserStatus => {
  if (user.banReason !== null) return 'banned';
  return user.isActive ? 'active' : 'inactive';
};

/** Who may open the drawer on a row: never yourself, and a superuser only for a superuser. Pure. */
export type UserLock = 'self' | 'superuser' | null;
export const userLockOf = (
  target: { id: string; isSuperuser: boolean },
  viewer: { id: string | undefined; isSuperuser: boolean },
): UserLock => {
  if (target.id === viewer.id) return 'self';
  return target.isSuperuser && !viewer.isSuperuser ? 'superuser' : null;
};
