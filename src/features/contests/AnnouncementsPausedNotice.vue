<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import InlineBit from '@/components/InlineBit.vue';
import { isAnnouncementStreamPaused, reconnectAnnouncementStream } from './use-announcement-feed';

/** "Live updates paused" with a reconnect, while the open announcements stream of `contestKey` (whoever owns it) has given up. */
defineProps<{ contestKey: string }>();
</script>

<template>
  <p
    v-if="isAnnouncementStreamPaused(contestKey)"
    data-testid="announcements-paused"
    class="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted"
  >
    <InlineBit kind="sweat" />
    {{ $t('contests.announcements.paused') }}
    <AppButton @click="reconnectAnnouncementStream(contestKey)">
      {{ $t('contests.announcements.reconnect') }}
    </AppButton>
  </p>
</template>
