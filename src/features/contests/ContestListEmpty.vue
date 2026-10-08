<script setup lang="ts">
import { computed } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';

const props = defineProps<{ phase: ContestPhase; isFiltered: boolean }>();
/** With a filter set, the empty text says the filter is the reason, not that the phase is empty. */
const messageKey = computed(() =>
  props.isFiltered ? 'contests.list.empty.noMatch' : `contests.list.empty.${props.phase}`,
);
/** An empty upcoming group points at the ended contests: a virtual run is the way to practise meanwhile. */
const showsEndedHint = computed(() => props.phase === 'upcoming' && !props.isFiltered);
const ENDED_TARGET = { name: 'contests', query: { phase: 'ended' } };
</script>

<template>
  <GlassCard as="div">
    <EmptyState>
      <span class="block font-semibold text-content">{{ $t(messageKey) }}</span>
      <span v-if="showsEndedHint" class="block">{{ $t('contests.list.empty.upcomingHint') }}</span>
      <RouterLink
        v-if="showsEndedHint"
        :to="ENDED_TARGET"
        class="mt-2 inline-flex min-h-11 items-center text-accent-text underline"
        >{{ $t('contests.list.empty.seeEnded') }}</RouterLink
      >
    </EmptyState>
  </GlassCard>
</template>
