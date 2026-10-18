<script setup lang="ts">
import { toRef } from 'vue';
import AnnouncementsPausedNotice from './AnnouncementsPausedNotice.vue';
import { useAnnouncementFeed } from './use-announcement-feed';

/** A contest page's own stream; `isStreaming` is false while the app shell streams this contest, whose paused state still shows here. */
const props = defineProps<{ contestKey: string; isStreaming: boolean }>();
const { message } = useAnnouncementFeed(toRef(props, 'contestKey'), toRef(props, 'isStreaming'));
</script>

<template>
  <p data-testid="announcement-live" role="status" aria-live="polite" class="sr-only">
    {{ message }}
  </p>
  <AnnouncementsPausedNotice :contest-key="contestKey" />
</template>
