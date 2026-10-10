<script setup lang="ts">
import { useLoadingStore } from '@/stores/loading.store';
import LoadingBit from './LoadingBit.vue';
import { useLoadingPhase } from './use-loading-phase';

/** The single place that turns "the app is waiting on first data" into a mascot swarm and one polite announcement. */
const loading = useLoadingStore();
const { phase, gone } = useLoadingPhase(() => loading.isWaiting);
</script>

<template>
  <p role="status" aria-live="polite" class="sr-only">
    {{ phase === 'walking' ? $t('common.loading') : '' }}
  </p>
  <LoadingBit :phase="phase" @gone="gone" />
</template>
