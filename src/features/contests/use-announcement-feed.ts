import { useQueryClient } from '@tanstack/vue-query';
import { computed, onScopeDispose, ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { Page } from '@/api/client';
import { openEventStream } from '@/api/events';
import type { EventHandlers, EventStream } from '@/api/events';
import type { Announcement } from '@/api/types/contests';
import { translate } from '@/i18n';
import { useViewerId } from '@/stores/use-viewer-id';

const FIRST_PAGE = 1;

const announcementIdOf = (data: unknown) =>
  typeof data === 'object' &&
  data !== null &&
  'announcementId' in data &&
  typeof data.announcementId === 'string'
    ? data.announcementId
    : null;

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
 * silently. One stream per contest page, open only while `isStreaming`. `paused` is set when the browser gave up.
 */
export function useAnnouncementFeed(key: Ref<string>, isStreaming: Ref<boolean>) {
  const queryClient = useQueryClient();
  const viewerId = useViewerId();
  const message = ref('');
  const listKey = () => ['contests', 'announcements', viewerId.value, key.value];
  const refresh = () => queryClient.invalidateQueries({ queryKey: listKey() });
  async function onAnnouncement(data: unknown) {
    const id = announcementIdOf(data);
    if (!id) return;
    await refresh();
    const first = queryClient.getQueryData<Page<Announcement>>([...listKey(), FIRST_PAGE]);
    const item = first?.items.find((announcement) => announcement.id === id);
    if (item) message.value = translate('contests.announcements.arrived', { title: item.title });
  }
  const path = computed(() => `/events/contests/${encodeURIComponent(key.value)}`);
  const { paused, reconnect } = useKeyedStream(path, isStreaming, {
    announcement: (data) => void onAnnouncement(data),
    resync: () => void refresh(),
  });
  return {
    message,
    paused,
    /** Reopens the stream and refetches the list, which may have missed frames while it was down. */
    reconnect: () => {
      reconnect();
      void refresh();
    },
  };
}
