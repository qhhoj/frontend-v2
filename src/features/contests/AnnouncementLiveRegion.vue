<script setup lang="ts">
import { toRef } from 'vue';
import AnnouncementsPausedNotice from './AnnouncementsPausedNotice.vue';
import { useAnnouncementFeed } from './use-announcement-feed';

/**
 * A contest page's own stream; `isStreaming` is false while the app shell streams this contest, whose paused state still shows here.
 * `isNoticeHidden`: the caller draws the paused notice itself (the sticky strip must not grow when the stream drops).
 */
const props = withDefaults(
  defineProps<{ contestKey: string; isStreaming: boolean; isNoticeHidden?: boolean }>(),
  { isNoticeHidden: false },
);
const { message } = useAnnouncementFeed(toRef(props, 'contestKey'), toRef(props, 'isStreaming'));
</script>

<template>
  <p data-testid="announcement-live" role="status" aria-live="polite" class="sr-only">
    {{ message }}
  </p>
  <AnnouncementsPausedNotice v-if="!isNoticeHidden" :contest-key="contestKey" />
</template>
