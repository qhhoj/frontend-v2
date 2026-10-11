import { computed, ref } from 'vue';
import type { RouteLocationNormalizedLoaded } from 'vue-router';
import { readStorage, writeStorage } from '@/lib/storage';
import { useViewerId } from '@/stores/use-viewer-id';

/** One admin page the viewer opened: its path, its screen title and the record it was about (a code, a key). */
export interface RecentScreen {
  path: string;
  titleKey: string;
  detail: string | null;
}
export const RECENT_LIMIT = 6;
/** Pages not worth a shortcut: the dashboard that lists them, and unknown admin paths. */
const SKIPPED_ROUTES = new Set(['admin-dashboard', 'admin-unknown']);

const isRecentScreen = (value: unknown): value is RecentScreen => {
  const candidate = value as Partial<RecentScreen> | null;
  return (
    typeof candidate?.path === 'string' &&
    typeof candidate.titleKey === 'string' &&
    (candidate.detail === null || typeof candidate.detail === 'string')
  );
};

/** The stored list, dropping anything malformed (an old format, a hand edit), never more than the limit. */
export function parseRecent(raw: string | null): RecentScreen[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter(isRecentScreen).slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

/** The visit first, once: an earlier visit to the same path moves up instead of repeating. */
export const withVisit = (list: readonly RecentScreen[], visit: RecentScreen): RecentScreen[] =>
  [visit, ...list.filter((entry) => entry.path !== visit.path)].slice(0, RECENT_LIMIT);

/** What a route is worth remembering as, or `null` for a page that is not a shortcut. */
export function visitOf(route: RouteLocationNormalizedLoaded): RecentScreen | null {
  const name = typeof route.name === 'string' ? route.name : '';
  if (!route.meta.titleKey || SKIPPED_ROUTES.has(name)) return null;
  const detail = Object.values(route.params).find((value) => typeof value === 'string');
  return { path: route.path, titleKey: route.meta.titleKey, detail: detail ?? null };
}

const storageKey = (viewerId: string) => `qhhoj.admin.recent.${viewerId}`;
/** Per account (an impersonating staff member keeps their own list), kept in this browser only. */
const lists = ref<Record<string, RecentScreen[]>>({});

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
