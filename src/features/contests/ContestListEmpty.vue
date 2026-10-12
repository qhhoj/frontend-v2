<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ContestPhase } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import { translate } from '@/i18n';
import type { ContestListRoute } from './use-contest-list-filters';

const props = defineProps<{
  phase: ContestPhase;
  isFiltered: boolean;
  /** A page number the list does not reach: the text says so and the link goes back to page 1. */
  isPastLastPage: boolean;
  firstPageTarget: RouteLocationRaw;
  /** The name (or slug) of the tag the list is filtered by, or null. */
  tagName?: string | null;
  /** The same list without the tag. */
  clearTagTarget?: RouteLocationRaw;
  /** The page the list lives on; the ended-contests hint stays inside it. */
  listRoute?: ContestListRoute;
}>();
const isTagEmpty = computed(() => Boolean(props.tagName) && !props.isPastLastPage);
/** With a filter set, the empty text says the filter is the reason, not that the phase is empty. */
const messageText = computed(() => {
  if (props.isPastLastPage) return translate('contests.list.empty.pastLastPage');
  if (isTagEmpty.value) return translate('contestTags.emptyTitle', { name: props.tagName });
  return translate(
    props.isFiltered ? 'contests.list.empty.noMatch' : `contests.list.empty.${props.phase}`,
  );
});
const showsUpcomingHint = computed(
  () => props.phase === 'upcoming' && !props.isFiltered && !props.isPastLastPage,
);
/** An empty upcoming group points at the ended contests: a virtual run is the way to practise meanwhile. */
const endedTarget = computed(() => ({
  ...(props.listRoute ?? { name: 'contests' }),
  query: { phase: 'ended' },
}));
const action = computed(() => {
  if (props.isPastLastPage)
    return { to: props.firstPageTarget, labelKey: 'contests.list.empty.backToFirstPage' };
  if (isTagEmpty.value && props.clearTagTarget)
    return { to: props.clearTagTarget, labelKey: 'contestTags.clear' };
  if (showsUpcomingHint.value)
    return { to: endedTarget.value, labelKey: 'contests.list.empty.seeEnded' };
  return null;
});
</script>

<template>
  <Card as="div">
    <EmptyState>
      <span class="block font-semibold text-content">{{ messageText }}</span>
      <span v-if="showsUpcomingHint" class="block">{{
        $t('contests.list.empty.upcomingHint')
      }}</span>
      <span v-if="isTagEmpty" class="block">{{ $t('contestTags.emptyHint') }}</span>
      <AppButton v-if="action" tone="primary" :to="action.to" class="mt-3">{{
        $t(action.labelKey)
      }}</AppButton>
    </EmptyState>
  </Card>
</template>
