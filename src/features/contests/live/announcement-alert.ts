import { reactive } from 'vue';
import type { Announcement } from '@/api/types/contests';
import { isUnread } from '../announcement-seen';

/** Announcements the viewer closed with "Đóng" in this page session: still unread (the tab badge counts them), no longer alerted. */
const dismissedIds = reactive(new Set<string>());
export const dismissAnnouncementAlert = (id: string): void => void dismissedIds.add(id);

/** The alert shows the newest announcement while it is unread and was not closed; older unread ones wait on the tab. */
export function alertedAnnouncement(
  newestFirst: readonly Announcement[],
  seenId: string,
  dismissed: ReadonlySet<string> = dismissedIds,
): Announcement | null {
  const newest = newestFirst[0];
  if (!newest || !isUnread(newest, seenId) || dismissed.has(newest.id)) return null;
  return newest;
}
