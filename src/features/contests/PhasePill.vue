<script setup lang="ts">
import type { ContestPhase } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';

defineProps<{ phase: ContestPhase }>();
/** An ended contest wears the pending verdict's grey pair. */
const PHASE_TONES: Record<ContestPhase, ChipTone> = {
  running: 'success',
  upcoming: 'accent',
  ended: 'P',
};
</script>

<template>
  <Chip size="md" :tone="PHASE_TONES[phase]" :dot="phase === 'running'">{{
    $t(`contests.phase.${phase}`)
  }}</Chip>
</template>
