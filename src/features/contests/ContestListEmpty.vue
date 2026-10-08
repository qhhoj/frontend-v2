<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ContestPhase } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';

const props = defineProps<{
  phase: ContestPhase;
  isFiltered: boolean;
  /** A page number the list does not reach: the text says so and the link goes back to page 1. */
  isPastLastPage: boolean;
  firstPageTarget: RouteLocationRaw;
}>();
/** With a filter set, the empty text says the filter is the reason, not that the phase is empty. */
const messageKey = computed(() => {
  if (props.isPastLastPage) return 'contests.list.empty.pastLastPage';
  return props.isFiltered ? 'contests.list.empty.noMatch' : `contests.list.empty.${props.phase}`;
});
const showsUpcomingHint = computed(
  () => props.phase === 'upcoming' && !props.isFiltered && !props.isPastLastPage,
);
/** An empty upcoming group points at the ended contests: a virtual run is the way to practise meanwhile. */
const ENDED_TARGET = { name: 'contests', query: { phase: 'ended' } };
const action = computed(() => {
  if (props.isPastLastPage)
    return { to: props.firstPageTarget, labelKey: 'contests.list.empty.backToFirstPage' };
  if (showsUpcomingHint.value)
    return { to: ENDED_TARGET, labelKey: 'contests.list.empty.seeEnded' };
  return null;
});
</script>

<template>
  <GlassCard as="div">
    <EmptyState>
      <span class="block font-semibold text-content">{{ $t(messageKey) }}</span>
      <span v-if="showsUpcomingHint" class="block">{{
        $t('contests.list.empty.upcomingHint')
      }}</span>
      <RouterLink
        v-if="action"
        :to="action.to"
        class="mt-3 inline-flex min-h-11 items-center rounded-pill bg-gradient-accent px-5 font-semibold text-on-accent"
        >{{ $t(action.labelKey) }}</RouterLink
      >
    </EmptyState>
  </GlassCard>
</template>
