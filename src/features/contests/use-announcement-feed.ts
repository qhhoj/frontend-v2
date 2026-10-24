import { useQueryClient } from '@tanstack/vue-query';
import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { Page } from '@/api/client';
import { isLiveStreamPaused, reconnectLiveStream, useLiveStream } from '@/api/events';
import type { LiveTarget } from '@/api/events';
import type { Announcement } from '@/api/types/contests';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';

const announcementStream = (key: string): LiveTarget<'/events/contests/{key}'> => ({
  route: '/events/contests/{key}',
  params: { key },
});
/** The rail stops claiming a live contest whose stream gave up. */
export const isAnnouncementStreamPaused = (key: string): boolean =>
  isLiveStreamPaused(announcementStream(key));
/** Reconnects the contest's open stream, for a page that shows the paused notice of a stream it does not own. */
export const reconnectAnnouncementStream = (key: string): void =>
  reconnectLiveStream(announcementStream(key));

/**
 * The contest's SSE stream (ids only): a new id refetches the list and says the new title once; a resync refetches
 * silently. One stream per contest: the app shell's for the contest the viewer is in, a contest page's for any other
 * running contest; open only while `isStreaming`.
 */
export function useAnnouncementFeed(key: Ref<string>, isStreaming: Ref<boolean>) {
  const queryClient = useQueryClient();
  const viewerId = useViewerId();
  const message = ref('');
  /** Ids already announced on this page: a repeated frame for one announcement says nothing new. */
  const announcedIds = new Set<string>();
  const listKey = () => ['contests', 'announcements', viewerId.value, key.value];
  async function onAnnouncement(id: string) {
    const isRepeat = announcedIds.has(id);
    announcedIds.add(id);
    // Emptied first, so a second announcement with the same title changes the text and is read again.
    if (!isRepeat) message.value = '';
    await live.refresh();
    if (isRepeat) return;
    const first = queryClient.getQueryData<Page<Announcement>>([
      ...listKey(),
      ANNOUNCEMENT_FIRST_PAGE,
    ]);
    const item = first?.items.find((announcement) => announcement.id === id);
    if (item) message.value = translate('contests.announcements.arrived', { title: item.title });
  }
  /** Reopened for another account (impersonation): the server authorised the stream for the viewer who opened it. */
  const target = () =>
    isStreaming.value ? { ...announcementStream(key.value), viewer: viewerId.value } : null;
  const live = useLiveStream(target, {
    frames: { announcement: (frame) => void onAnnouncement(frame.announcementId) },
    cacheKey: listKey,
  });
  watch(key, () => announcedIds.clear());
  return { message };
}
