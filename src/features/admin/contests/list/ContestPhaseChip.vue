<script setup lang="ts">
import { CalendarClock, CircleCheck, CirclePlay } from 'lucide-vue-next';
import type { ContestPhase } from '@/api/types/contests';
import AdminChip from '../../ui/AdminChip.vue';
import type { ChipTone } from '../../ui/AdminChip.vue';

/** The contest's phase as a chip: running (accent), upcoming (info), ended (neutral). */
defineProps<{ phase: ContestPhase }>();
const LOOK = {
  running: { tone: 'accent', icon: CirclePlay },
  upcoming: { tone: 'info', icon: CalendarClock },
  ended: { tone: 'neutral', icon: CircleCheck },
} satisfies Record<ContestPhase, { tone: ChipTone; icon: unknown }>;
</script>

<template>
  <AdminChip :tone="LOOK[phase].tone" :icon="LOOK[phase].icon">
    {{ $t(`contests.phase.${phase}`) }}
  </AdminChip>
</template>
