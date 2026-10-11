<script setup lang="ts">
import type { PolygonPackageState } from '@/api/types/polygon';
import AdminChip from '../../ui/AdminChip.vue';
import type { ChipTone } from '../../ui/AdminChip.vue';

/** A Polygon package state as a chip; the word carries the meaning, the colour only repeats it. */
defineProps<{ state: PolygonPackageState }>();
const TONES: Record<PolygonPackageState, ChipTone> = {
  READY: 'positive',
  RUNNING: 'caution',
  FAILED: 'negative',
  NONE: 'neutral',
};
</script>

<template>
  <AdminChip :tone="TONES[state]" class="font-mono">{{
    $t(`admin.polygonLink.packageState.${state}`)
  }}</AdminChip>
</template>
