<script setup lang="ts">
import { CalendarClock, CircleCheck, CirclePlay, FilePen, Snowflake } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import type { ChipTone } from '@/components/ui/Chip.vue';
import { contestStateOf } from './contest-state';
import type { ContestState } from './contest-state';

/** The contest's state as one chip: draft (warning), upcoming (info), running (accent), frozen (info), ended (neutral). */
const props = defineProps<{ phase: ContestPhase; isVisible?: boolean; isFrozen?: boolean }>();
const LOOK = {
  draft: { tone: 'warning', icon: FilePen, label: 'admin.contests.list.state.draft' },
  upcoming: { tone: 'info', icon: CalendarClock, label: 'contests.phase.upcoming' },
  running: { tone: 'accent', icon: CirclePlay, label: 'contests.phase.running' },
  frozen: { tone: 'info', icon: Snowflake, label: 'admin.contests.list.state.frozen' },
  ended: { tone: 'neutral', icon: CircleCheck, label: 'contests.phase.ended' },
} satisfies Record<ContestState, { tone: ChipTone; icon: unknown; label: string }>;
const state = computed(() => contestStateOf(props));
</script>

<template>
  <Chip :tone="LOOK[state].tone" :icon="LOOK[state].icon" :data-state="state">
    {{ $t(LOOK[state].label) }}
  </Chip>
</template>
