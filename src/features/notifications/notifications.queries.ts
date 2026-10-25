import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query';
import { computed, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/api/notifications.api';
import type { NotificationListQuery } from '@/api/types/notifications';
import { useSessionStore } from '@/stores/session.store';
import { useViewerId } from '@/stores/use-viewer-id';
import { keepPreviousForViewer } from '@/features/contests/keep-previous-for-viewer';

/** Spec 3.1: the bell catches up every minute and on window focus (announcements send no nudge). */
export const UNREAD_POLL_MS = 60_000;
/** The drawer shows the newest rows of the page's first "all" page: one key for both. */
export const LATEST_ROWS = 5;
export const DRAWER_QUERY: NotificationListQuery = { state: 'all', page: 1 };
const HIGH_PRIORITY_QUERY: NotificationListQuery = { state: 'unread', priority: 'high', page: 1 };

/** Every notification read of one viewer starts with this key: a write or a nudge invalidates it once. */
export const notificationsKey = (viewer: string) => ['notifications', viewer] as const;

const useIsSignedIn = () => {
  const session = useSessionStore();
  return computed(() => session.user !== null);
};

export function useUnreadCountQuery() {
  const viewer = useViewerId();
  return useQuery({
    queryKey: computed(() => [...notificationsKey(viewer.value), 'unread-count']),
    queryFn: fetchUnreadCount,
    enabled: useIsSignedIn(),
    refetchInterval: UNREAD_POLL_MS,
    refetchOnWindowFocus: 'always',
  });
}

/** `isEnabled`: the drawer reads only while it is open, so a page load costs the count alone. */
export function useNotificationsQuery(
  query: MaybeRefOrGetter<NotificationListQuery>,
  isEnabled: MaybeRefOrGetter<boolean> = true,
) {
  const viewer = useViewerId();
  const isSignedIn = useIsSignedIn();
  return useQuery({
    queryKey: computed(() => [...notificationsKey(viewer.value), 'list', { ...toValue(query) }]),
    queryFn: () => fetchNotifications(toValue(query)),
    enabled: computed(() => isSignedIn.value && toValue(isEnabled)),
    placeholderData: computed(() => keepPreviousForViewer(viewer.value)),
  });
}

/** The banner's row: the newest unread `high` notification (a filter on the list, no route of its own). */
export const useHighPriorityQuery = () => useNotificationsQuery(HIGH_PRIORITY_QUERY);

export function useInvalidateNotifications() {
  const client = useQueryClient();
  const viewer = useViewerId();
  return () => client.invalidateQueries({ queryKey: notificationsKey(viewer.value) });
}

/** Lists only (drawer, page, banner): the bell calls it when the polled count rises with no nudge, e.g. a contest announcement. */
export function useInvalidateNotificationLists() {
  const client = useQueryClient();
  const viewer = useViewerId();
  return () => client.invalidateQueries({ queryKey: [...notificationsKey(viewer.value), 'list'] });
}

export function useMarkRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: markNotificationRead, onSettled: invalidate });
}

export function useMarkAllRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({ mutationFn: markAllNotificationsRead, onSettled: invalidate });
}
