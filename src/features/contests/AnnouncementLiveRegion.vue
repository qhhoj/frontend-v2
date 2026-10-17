<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed, toRef } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import {
  isAnnouncementStreamPaused,
  reconnectAnnouncementStream,
  useAnnouncementFeed,
} from './use-announcement-feed';

/** `isStreaming` false while the app shell streams this contest (the viewer is in it): its paused state still shows here. */
const props = defineProps<{ contestKey: string; isStreaming: boolean }>();
const { message, paused, reconnect } = useAnnouncementFeed(
  toRef(props, 'contestKey'),
  toRef(props, 'isStreaming'),
);
const isPaused = computed(() => paused.value || isAnnouncementStreamPaused(props.contestKey));
const reconnectEither = () =>
  props.isStreaming ? reconnect() : reconnectAnnouncementStream(props.contestKey);
</script>

<template>
  <p data-testid="announcement-live" role="status" aria-live="polite" class="sr-only">
    {{ message }}
  </p>
  <p
    v-if="isPaused"
    data-testid="announcements-paused"
    class="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted"
  >
    <InlineBit kind="sweat" />
    {{ $t('contests.announcements.paused') }}
    <AppButton @click="reconnectEither()">
      {{ $t('contests.announcements.reconnect') }}
    </AppButton>
  </p>
</template>
