<script setup lang="ts">
import { toRef } from 'vue';
import InlineBit from '@/components/InlineBit.vue';
import { useAnnouncementFeed } from './use-announcement-feed';

const props = defineProps<{ contestKey: string; isStreaming: boolean }>();
const { message, paused, reconnect } = useAnnouncementFeed(
  toRef(props, 'contestKey'),
  toRef(props, 'isStreaming'),
);
</script>

<template>
  <p data-testid="announcement-live" role="status" aria-live="polite" class="sr-only">
    {{ message }}
  </p>
  <p
    v-if="paused"
    data-testid="announcements-paused"
    class="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted"
  >
    <InlineBit kind="sweat" />
    {{ $t('contests.announcements.paused') }}
    <button
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content hover:bg-surface-hover"
      @click="reconnect()"
    >
      {{ $t('contests.announcements.reconnect') }}
    </button>
  </p>
</template>
