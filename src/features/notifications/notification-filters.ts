import type { RouteLocationRaw } from 'vue-router';
import { NOTIFICATION_STATES } from '@/api/types/notifications';
import type { NotificationState } from '@/api/types/notifications';
import { AVAILABLE_KIND_GROUPS } from './notification-kinds';
import type { KindGroup } from './notification-kinds';

/** `?kind=` is one of the four chips of the "Loại" rail (requires VNOI backend B1 ask: the `kind` query); anything else is no kind filter. */
export function kindGroupFromQuery(value: unknown): KindGroup | null {
  const text = Array.isArray(value) ? value[0] : value;
  return AVAILABLE_KIND_GROUPS.find((group) => group === text) ?? null;
}

/** `?state=` as the backend accepts it; anything else lists everything. */
export function stateFromQuery(value: unknown): NotificationState {
  const text = Array.isArray(value) ? value[0] : value;
  return NOTIFICATION_STATES.find((state) => state === text) ?? 'all';
}

/** A filter link starts at page 1; "all" without a kind is the bare address. */
export const filterLink = (
  state: NotificationState,
  group: KindGroup | null = null,
): RouteLocationRaw => ({
  name: 'notifications',
  query: {
    ...(state === 'all' ? {} : { state }),
    ...(group === null ? {} : { kind: group }),
  },
});
