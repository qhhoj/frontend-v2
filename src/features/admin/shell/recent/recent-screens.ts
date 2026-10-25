import { computed, ref } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import { useViewerId } from '@/stores/use-viewer-id';

/** One admin page the viewer opened: its path, its screen title and the record it was about (a code, a key). */
export interface RecentVisit {
  path: string;
  titleKey: string;
  detail: string | null;
}
/** A remembered page and how many times this browser opened it. */
export interface RecentScreen extends RecentVisit {
  visits: number;
}
/** Pages remembered per account; the oldest falls off, so a screen no longer used stops being a shortcut. */
export const RECENT_LIMIT = 20;
/** The dashboard's "Lối tắt": the most-opened pages. */
export const SHORTCUT_LIMIT = 6;
/** Pages not worth a shortcut: the dashboard that lists them, and unknown admin paths. */
const SKIPPED_ROUTES = new Set(['admin-dashboard', 'admin-unknown']);

const isRecentVisit = (value: unknown): value is RecentVisit & { visits?: unknown } => {
  const candidate = value as Partial<RecentScreen> | null;
  return (
    typeof candidate?.path === 'string' &&
    typeof candidate.titleKey === 'string' &&
    (candidate.detail === null || typeof candidate.detail === 'string')
  );
};
/** An entry stored before visits were counted counts as one visit. */
const visitsOf = (value: unknown) =>
  typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : 1;

/** The stored list, newest first, dropping anything malformed (an old format, a hand edit), never more than the limit. */
export function parseRecent(raw: string | null): RecentScreen[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return [];
    return value
      .filter(isRecentVisit)
      .slice(0, RECENT_LIMIT)
      .map(({ path, titleKey, detail, visits }) => ({
        path,
        titleKey,
        detail,
        visits: visitsOf(visits),
      }));
  } catch {
    return [];
  }
}

/** The visit first, once: an earlier visit to the same path moves up and adds to its count instead of repeating. */
export function withVisit(list: readonly RecentScreen[], visit: RecentVisit): RecentScreen[] {
  const earlier = list.find((entry) => entry.path === visit.path);
  const entry = { ...visit, visits: (earlier?.visits ?? 0) + 1 };
  return [entry, ...list.filter((other) => other.path !== visit.path)].slice(0, RECENT_LIMIT);
}

/** The most-opened pages; between equal counts the more recent one wins (the sort is stable). */
export const shortcutsOf = (list: readonly RecentScreen[]): RecentScreen[] =>
  [...list].sort((left, right) => right.visits - left.visits).slice(0, SHORTCUT_LIMIT);

/** What a route is worth remembering as, or `null` for a page that is not a shortcut. */
export function visitOf(route: RouteLocationNormalizedLoaded): RecentVisit | null {
  const name = typeof route.name === 'string' ? route.name : '';
  if (!route.meta.titleKey || SKIPPED_ROUTES.has(name)) return null;
  const detail = Object.values(route.params).find((value) => typeof value === 'string');
  return { path: route.path, titleKey: route.meta.titleKey, detail: detail ?? null };
}

const STORAGE_PREFIX = 'qhhoj.admin.recent.';
const storageKey = (viewerId: string) => `${STORAGE_PREFIX}${viewerId}`;
/** Per account (an impersonating staff member keeps their own list), kept in this browser only. */
const lists = ref<Record<string, RecentScreen[]>>({});

/** Nobody is signed in (sign-out, or a session that expired while the browser was closed): every account's list goes, so a shared browser keeps no trail of admin pages. */
export function forgetAllRecentScreens() {
  lists.value = {};
  try {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith(STORAGE_PREFIX));
    keys.forEach((key) => removeStorage(key));
  } catch {
    // Unavailable storage: nothing was kept.
  }
}

export function useRecentScreens() {
  const viewerId = useViewerId();
  const recent = computed(
    () => lists.value[viewerId.value] ?? parseRecent(readStorage(storageKey(viewerId.value))),
  );
  function remember(route: RouteLocationNormalizedLoaded) {
    const visit = visitOf(route);
    if (!visit) return;
    const next = withVisit(recent.value, visit);
    lists.value = { ...lists.value, [viewerId.value]: next };
    writeStorage(storageKey(viewerId.value), JSON.stringify(next));
  }
  return { recent, remember };
}
