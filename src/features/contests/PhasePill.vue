<script setup lang="ts">
import type { ContestPhase } from '@/api/types/contests';

defineProps<{ phase: ContestPhase }>();
const PHASE_CLASSES: Record<ContestPhase, string> = {
  running: 'bg-verdict-ac-bg text-verdict-ac',
  upcoming: 'bg-accent-soft text-accent-soft-text',
  ended: 'bg-verdict-pending-bg text-verdict-pending',
};
</script>

<template>
  <span
    class="inline-flex min-h-7 items-center gap-1.5 rounded-pill px-3 text-[13px] font-semibold whitespace-nowrap"
    :class="PHASE_CLASSES[phase]"
  >
    <span aria-hidden="true" class="size-2 rounded-full bg-current" />{{
      $t(`contests.phase.${phase}`)
    }}
  </span>
</template>
