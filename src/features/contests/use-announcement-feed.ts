import { useQueryClient } from '@tanstack/vue-query';
import { computed, onScopeDispose, reactive, ref, watch } from 'vue';
import type { Ref } from 'vue';
import { ANNOUNCEMENT_FIRST_PAGE } from '@/api/contests.api';
import type { Page } from '@/api/client';
import { openEventStream } from '@/api/events';
import type { EventHandlers, EventStream } from '@/api/events';
import type { Announcement } from '@/api/types/contests';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';

const announcementIdOf = (data: unknown) =>
  typeof data === 'object' &&
  data !== null &&
  'announcementId' in data &&
  typeof data.announcementId === 'string'
    ? data.announcementId
    : null;

/** Contest keys whose stream gave up; the rail stops claiming a live contest for them. */
const pausedByContest = reactive(new Map<string, boolean>());
export const isAnnouncementStreamPaused = (key: string): boolean =>
  pausedByContest.get(key) === true;
/** The reconnect of the open stream per contest key, for a page that shows the paused notice of a stream it does not own. */
const reconnectByContest = new Map<string, () => void>();
export const reconnectAnnouncementStream = (key: string): void => reconnectByContest.get(key)?.();

/** One stream at a time: reopened when `path` or `enabled` changes, closed when disabled or on scope end. */
function useKeyedStream(path: Ref<string>, enabled: Ref<boolean>, handlers: EventHandlers) {
  const paused = ref(false);
  /** `reconnect` bumps it, which reopens the stream. */
  const connectionAttempt = ref(0);
  let stream: EventStream | null = null;
  const close = () => {
    stream?.close();
    stream = null;
  };
  watch(
    [path, enabled, connectionAttempt],
    ([streamPath, isEnabled]) => {
      close();
      paused.value = false;
      if (!isEnabled) return;
      stream = openEventStream(streamPath, handlers, () => (paused.value = true));
    },
    { immediate: true },
  );
  onScopeDispose(close);
  return { paused, reconnect: () => (connectionAttempt.value += 1) };
}

/**
 * The contest's SSE stream (ids only): a new id refetches the list and says the new title once; a resync refetches
 * silently. One stream per contest: the app shell's for the contest the viewer is in, a contest page's for any other
 * running contest; open only while `isStreaming`. `paused` is set when the browser gave up.
 */
export function useAnnouncementFeed(key: Ref<string>, isStreaming: Ref<boolean>) {
  const queryClient = useQueryClient();
  const viewerId = useViewerId();
  const message = ref('');
  /** Ids already announced on this page: a repeated frame for one announcement says nothing new. */
  const announcedIds = new Set<string>();
  const listKey = () => ['contests', 'announcements', viewerId.value, key.value];
  const refresh = () => queryClient.invalidateQueries({ queryKey: listKey() });
  async function onAnnouncement(data: unknown) {
    const id = announcementIdOf(data);
    if (!id) return;
    const isRepeat = announcedIds.has(id);
    announcedIds.add(id);
    // Emptied first, so a second announcement with the same title changes the text and is read again.
    if (!isRepeat) message.value = '';
    await refresh();
    if (isRepeat) return;
    const first = queryClient.getQueryData<Page<Announcement>>([
      ...listKey(),
      ANNOUNCEMENT_FIRST_PAGE,
    ]);
    const item = first?.items.find((announcement) => announcement.id === id);
    if (item) message.value = translate('contests.announcements.arrived', { title: item.title });
  }
  const path = computed(() => `/events/contests/${encodeURIComponent(key.value)}`);
  const { paused, reconnect } = useKeyedStream(path, isStreaming, {
    announcement: (data) => void onAnnouncement(data),
    resync: () => void refresh(),
  });
  /** Only the open stream speaks for its contest in the shared maps; a page that is not streaming leaves them alone. */
  const release = (contestKey: string) => {
    if (reconnectByContest.get(contestKey) !== reconnectAndRefresh) return;
    pausedByContest.delete(contestKey);
    reconnectByContest.delete(contestKey);
  };
  watch(
    [key, paused, isStreaming],
    ([contestKey, isPaused, isOpen], [previousKey]) => {
      if (previousKey !== undefined && previousKey !== contestKey) {
        release(previousKey);
        announcedIds.clear();
      }
      if (!isOpen) return release(contestKey);
      pausedByContest.set(contestKey, isPaused);
      reconnectByContest.set(contestKey, reconnectAndRefresh);
    },
    { immediate: true },
  );
  /** Reopens the stream and refetches the list, which may have missed frames while it was down. */
  function reconnectAndRefresh() {
    reconnect();
    void refresh();
  }
  onScopeDispose(() => release(key.value));
  return { message, paused, reconnect: reconnectAndRefresh };
}
