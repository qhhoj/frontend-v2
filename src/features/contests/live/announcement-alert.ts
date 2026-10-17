import { reactive } from 'vue';
import type { Announcement } from '@/api/types/contests';
import { isUnread } from '../announcement-seen';

/** `viewer:id` of announcements closed with "Đóng" in this page session: still unread (the tab badge counts them), no longer alerted. */
const dismissed = reactive(new Set<string>());
export const dismissAnnouncementAlert = (viewerId: string, id: string): void =>
  void dismissed.add(`${viewerId}:${id}`);
export const isAlertDismissed = (viewerId: string, id: string): boolean =>
  dismissed.has(`${viewerId}:${id}`);

/** The alert shows the newest announcement while it is unread and was not closed; older unread ones wait on the tab. */
export function alertedAnnouncement(
  newestFirst: readonly Announcement[],
  seenId: string,
  isDismissed: (id: string) => boolean,
): Announcement | null {
  const newest = newestFirst[0];
  if (!newest || !isUnread(newest, seenId) || isDismissed(newest.id)) return null;
  return newest;
}
