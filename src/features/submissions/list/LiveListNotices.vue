<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
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
    <AppButton @click="emit('reconnect')">
      {{ $t('submissions.liveReload') }}
    </AppButton>
  </p>
  <div v-if="newCount > 0" class="sticky top-20 z-10 w-fit rounded-control bg-surface-solid">
    <AppButton data-testid="new-pill" @click="emit('showNew')">
      {{ $t('submissions.newPill', { count: newCount }, newCount) }}
    </AppButton>
  </div>
</template>
