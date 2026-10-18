import type { Announcement } from '@/api/types/contests';
import { isUnread } from '../announcement-seen';

/** The alert shows the newest announcement while it is unread and newer than the last one closed; older unread ones wait on the tab. */
export function alertedAnnouncement(
  newestFirst: readonly Announcement[],
  seenId: string,
  closedId: string,
): Announcement | null {
  const newest = newestFirst[0];
  if (!newest || !isUnread(newest, seenId) || !isUnread(newest, closedId)) return null;
  return newest;
}
