<script setup lang="ts">
import InlineBit from '@/components/InlineBit.vue';

/** Above the list: the live feed dropped (with a reload button), or rows arrived above the page shown (the "N mới" pill). */
defineProps<{ paused: boolean; newCount: number }>();
const emit = defineEmits<{ reconnect: []; showNew: [] }>();
</script>

<template>
  <p
    v-if="paused"
    data-testid="live-paused"
    class="flex flex-wrap items-center gap-3 text-sm text-muted"
  >
    <InlineBit kind="sweat" />
    {{ $t('submissions.livePaused') }}
    <button
      type="button"
      class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content hover:bg-surface-hover"
      @click="emit('reconnect')"
    >
      {{ $t('submissions.liveReload') }}
    </button>
  </p>
  <div v-if="newCount > 0" class="sticky top-20 z-10 w-fit rounded-pill bg-surface-solid">
    <button
      type="button"
      data-testid="new-pill"
      class="min-h-11 rounded-pill border border-line-accent bg-accent-soft px-4 font-semibold text-accent-soft-text hover:opacity-90"
      @click="emit('showNew')"
    >
      {{ $t('submissions.newPill', { count: newCount }, newCount) }}
    </button>
  </div>
</template>
