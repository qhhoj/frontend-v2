<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';

/** The "Trực tiếp" pill: pressed while the list follows new submissions live (`live` in the URL). */
defineProps<{ live: boolean }>();
const emit = defineEmits<{ 'update:live': [live: boolean] }>();
</script>

<template>
  <AppButton
    tone="ghost"
    data-testid="live-toggle"
    class="shrink-0"
    :pressed="live"
    :title="$t('submissions.rail.live')"
    @click="emit('update:live', !live)"
  >
    <template #icon>
      <span
        aria-hidden="true"
        class="size-2 rounded-pill"
        :class="live ? 'bg-positive motion-safe:animate-pulse' : 'bg-line-strong'"
      />
    </template>
    {{ $t('submissions.live') }}
  </AppButton>
</template>
