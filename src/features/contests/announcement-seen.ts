import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { Announcement } from '@/api/types/contests';
import { readStorage, writeStorage } from '@/lib/storage';
import { useViewerId } from '@/stores/use-viewer-id';
import { useContestAnnouncementsQuery } from './contests.queries';

const STORAGE_PREFIX = 'qhhoj.contest-announcements-seen.';
/** Newest announcement id seen per viewer and contest; reactive so the tab badge follows the Announcements tab. */
const seen = reactive(new Map<string, string>());
/** Marks storage refused to keep (blocked or full): they live on for this page session only. */
const unsavedMarks = new Map<string, string>();

/** One mark per viewer and contest: one account's marks on a shared browser never apply to another account. */
const markKey = (viewerId: string, contestKey: string) => `${viewerId}:${contestKey}`;
const newerId = (first: string, second: string) => (first > second ? first : second);

/**
 * Storage is the source of truth, re-read each time a contest page opens. A mark storage refused stays in memory,
 * so a blocked storage does not bring the badge back within the session.
 */
export function loadSeenAnnouncement(viewerId: string, contestKey: string): void {
  const key = markKey(viewerId, contestKey);
  const stored = readStorage(STORAGE_PREFIX + key) ?? '';
  seen.set(key, newerId(stored, unsavedMarks.get(key) ?? ''));
}
export const seenAnnouncementId = (viewerId: string, contestKey: string): string =>
  seen.get(markKey(viewerId, contestKey)) ?? '';
/** UUID v7 ids sort by time as strings, so "newer" is a string comparison. */
export const isUnread = (announcement: Announcement, seenId: string): boolean =>
  announcement.id > seenId;

export function markAnnouncementsSeen(
  viewerId: string,
  contestKey: string,
  newestId: string,
): void {
  loadSeenAnnouncement(viewerId, contestKey);
  if (newestId <= seenAnnouncementId(viewerId, contestKey)) return;
  const key = markKey(viewerId, contestKey);
  seen.set(key, newestId);
  writeStorage(STORAGE_PREFIX + key, newestId);
  if (readStorage(STORAGE_PREFIX + key) !== newestId) unsavedMarks.set(key, newestId);
}

/** Unread on the newest page only: older pages cannot hold anything newer. */
export function useUnreadAnnouncementCount(key: Ref<string>) {
  const viewerId = useViewerId();
  watch([viewerId, key], ([viewer, contestKey]) => loadSeenAnnouncement(viewer, contestKey), {
    immediate: true,
  });
  const { data } = useContestAnnouncementsQuery(key, ref(ANNOUNCEMENT_FIRST_PAGE));
  return computed(
    () =>
      (data.value?.items ?? []).filter((item) =>
        isUnread(item, seenAnnouncementId(viewerId.value, key.value)),
      ).length,
  );
}
