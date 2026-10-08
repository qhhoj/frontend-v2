import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { Announcement } from '@/api/types/contests';
import { readStorage, writeStorage } from '@/lib/storage';
import { useContestAnnouncementsQuery } from './contests.queries';

const STORAGE_PREFIX = 'qhhoj.contest-announcements-seen.';
/** Newest announcement id seen per contest key; reactive so the tab badge follows the Announcements tab. */
const seen = reactive(new Map<string, string>());

/** Storage is the source of truth: every contest page re-reads its mark when it opens. */
export function loadSeenAnnouncement(key: string): void {
  seen.set(key, readStorage(STORAGE_PREFIX + key) ?? '');
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
}

const FIRST_PAGE = 1;
/** Unread on the newest page only: older pages cannot hold anything newer. */
export function useUnreadAnnouncementCount(key: Ref<string>) {
  watch(key, loadSeenAnnouncement, { immediate: true });
  const { data } = useContestAnnouncementsQuery(key, ref(FIRST_PAGE));
  return computed(
    () =>
      (data.value?.items ?? []).filter((item) => isUnread(item, seenAnnouncementId(key.value)))
        .length,
  );
}
