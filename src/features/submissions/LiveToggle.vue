<script setup lang="ts">
/** The "Trực tiếp" pill: pressed while the list follows new submissions live (`live` in the URL). */
defineProps<{ live: boolean }>();
const emit = defineEmits<{ 'update:live': [live: boolean] }>();
</script>

<template>
  <button
    type="button"
    data-testid="live-toggle"
    :aria-pressed="live"
    :title="$t('submissions.rail.live')"
    class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-pill px-3 text-meta font-semibold whitespace-nowrap hover:bg-surface-hover"
    :class="live ? 'text-positive' : 'text-muted'"
    @click="emit('update:live', !live)"
  >
    <span
      aria-hidden="true"
      class="size-2 rounded-pill"
      :class="live ? 'bg-positive motion-safe:animate-pulse' : 'bg-line-strong'"
    />
    {{ $t('submissions.live') }}
  </button>
</template>
