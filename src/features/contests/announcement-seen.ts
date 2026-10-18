import { computed, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { Announcement } from '@/api/types/contests';
import { readStorage, writeStorage } from '@/lib/storage';
import { useViewerId } from '@/stores/use-viewer-id';
import { useContestAnnouncementsQuery } from './contests.queries';

/** One mark per viewer and contest: one account's marks on a shared browser never apply to another account. */
const markKey = (viewerId: string, contestKey: string) => `${viewerId}:${contestKey}`;
const newerId = (first: string, second: string) => (first > second ? first : second);

/**
 * The newest announcement id reached per viewer and contest, kept in storage under `prefix`. Storage is the source of
 * truth, re-read by `load` each time a page opens; a mark storage refused (blocked or full) stays in memory, so it holds
 * for the page session. Reactive, so badges and alerts follow `raise`. A mark never moves backwards.
 */
function createAnnouncementMarks(prefix: string) {
  const marks = reactive(new Map<string, string>());
  const unsaved = new Map<string, string>();
  const load = (viewerId: string, contestKey: string): void => {
    const key = markKey(viewerId, contestKey);
    const stored = readStorage(prefix + key) ?? '';
    marks.set(key, newerId(stored, unsaved.get(key) ?? ''));
  };
  const get = (viewerId: string, contestKey: string): string =>
    marks.get(markKey(viewerId, contestKey)) ?? '';
  const raise = (viewerId: string, contestKey: string, newestId: string): void => {
    load(viewerId, contestKey);
    if (newestId <= get(viewerId, contestKey)) return;
    const key = markKey(viewerId, contestKey);
    marks.set(key, newestId);
    writeStorage(prefix + key, newestId);
    if (readStorage(prefix + key) !== newestId) unsaved.set(key, newestId);
  };
  return { load, get, raise };
}

/** Read on the Announcements tab: the tab and bar badges count what is newer. */
const seenMarks = createAnnouncementMarks('qhhoj.contest-announcements-seen.');
export const loadSeenAnnouncement = seenMarks.load;
export const seenAnnouncementId = seenMarks.get;
export const markAnnouncementsSeen = seenMarks.raise;
/** Closed with "Đóng" on the new-announcement alert: still unread (the badges count it), no longer alerted. */
export const closedAlertMarks = createAnnouncementMarks('qhhoj.contest-announcement-alert-closed.');

/** UUID v7 ids sort by time as strings, so "newer" is a string comparison. */
export const isUnread = (announcement: Announcement, seenId: string): boolean =>
  announcement.id > seenId;

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
