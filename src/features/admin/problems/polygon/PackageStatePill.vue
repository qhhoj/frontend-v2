<script setup lang="ts">
import type { PolygonPackageState } from '@/api/types/polygon';

/** A Polygon package state as a pill; the word carries the meaning, the colour only repeats it. */
defineProps<{ state: PolygonPackageState }>();
const PILL_CLASS: Record<PolygonPackageState, string> = {
  READY: 'bg-verdict-ac-bg text-verdict-ac',
  RUNNING: 'bg-verdict-tle-bg text-verdict-tle',
  FAILED: 'bg-verdict-wa-bg text-verdict-wa',
  NONE: 'bg-surface-strong text-muted',
};
</script>

<template>
  <span
    class="inline-flex items-center rounded-pill px-2.5 py-0.5 font-mono text-xs font-bold"
    :class="PILL_CLASS[state]"
    >{{ $t(`admin.polygonLink.packageState.${state}`) }}</span
  >
</template>
