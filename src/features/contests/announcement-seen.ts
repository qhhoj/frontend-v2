import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { Announcement } from '@/api/types/contests';
import { readStorage, writeStorage } from '@/lib/storage';
import { useContestAnnouncementsQuery } from './contests.queries';

const STORAGE_PREFIX = 'qhhoj.contest-announcements-seen.';
/** Newest announcement id seen per contest key; reactive so the tab badge follows the Announcements tab. */
const seen = reactive(new Map<string, string>());
/** Marks storage refused to keep (blocked or full): they live on for this page session only. */
const unsavedMarks = new Map<string, string>();

const newerId = (first: string, second: string) => (first > second ? first : second);

/**
 * Storage is the source of truth, re-read each time a contest page opens. A mark storage refused stays in memory,
 * so a blocked storage does not bring the badge back within the session.
 */
export function loadSeenAnnouncement(key: string): void {
  const stored = readStorage(STORAGE_PREFIX + key) ?? '';
  seen.set(key, newerId(stored, unsavedMarks.get(key) ?? ''));
}
export const seenAnnouncementId = (key: string): string => seen.get(key) ?? '';
/** UUID v7 ids sort by time as strings, so "newer" is a string comparison. */
export const isUnread = (announcement: Announcement, seenId: string): boolean =>
  announcement.id > seenId;

export function markAnnouncementsSeen(key: string, newestId: string): void {
  loadSeenAnnouncement(key);
  if (newestId <= seenAnnouncementId(key)) return;
  seen.set(key, newestId);
  writeStorage(STORAGE_PREFIX + key, newestId);
  if (readStorage(STORAGE_PREFIX + key) !== newestId) unsavedMarks.set(key, newestId);
}

/** Unread on the newest page only: older pages cannot hold anything newer. */
export function useUnreadAnnouncementCount(key: Ref<string>) {
  watch(key, loadSeenAnnouncement, { immediate: true });
  const { data } = useContestAnnouncementsQuery(key, ref(ANNOUNCEMENT_FIRST_PAGE));
  return computed(
    () =>
      (data.value?.items ?? []).filter((item) => isUnread(item, seenAnnouncementId(key.value)))
        .length,
  );
}
