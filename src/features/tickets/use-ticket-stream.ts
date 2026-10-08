import { useQueryClient } from '@tanstack/vue-query';
import { onScopeDispose, ref, toValue, watch } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { useViewerId } from '@/stores/use-viewer-id';
import { createTicketFeed } from './ticket-feed';

/**
 * Live ticket updates (E20): ids only, so each burst refetches the tickets once and is announced once.
 * The feed follows the ticket id and the viewer: a change closes the old stream and opens a new one.
 */
export function useTicketStream(ticketId: MaybeRefOrGetter<string | null>) {
  const client = useQueryClient();
  const viewer = useViewerId();
  const isLive = ref(true);
  const announcement = ref('');
  const feed = createTicketFeed({
    refetch: () => void client.invalidateQueries({ queryKey: ['tickets'] }),
    announce: (text) => (announcement.value = text),
    onOpened: () => {
      isLive.value = true;
      announcement.value = '';
    },
    onGaveUp: () => (isLive.value = false),
  });
  watch(
    () => [toValue(ticketId), viewer.value] as const,
    ([id]) => feed.follow(id),
    { immediate: true },
  );
  onScopeDispose(feed.stop);
  return { isLive, announcement };
}
