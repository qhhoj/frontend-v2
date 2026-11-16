<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { ContestListItem, ContestPhase } from '@/api/types/contests';
import EmptyState from '@/components/EmptyState.vue';
import { translate } from '@/i18n';
import { formatDate } from '@/lib/format-date';
import { useLocaleStore } from '@/stores/locale.store';
import type { ContestListRoute } from './use-contest-list-filters';

/**
 * A group with nothing in it: one inline line (`EmptyState inline`), never a box. With a filter set the text says the filter is the
 * reason. An empty "Đang diễn ra" names the next contest after "·" (`nextContest`), so the line still gives something to look
 * forward to; an empty upcoming group points at the ended contests (a virtual run is the way to practise meanwhile).
 */
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
  /** The first upcoming contest, said after an empty running group. */
  nextContest?: ContestListItem | null;
}>();
const locale = useLocaleStore();
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
const endedTarget = computed(() => ({
  ...(props.listRoute ?? { name: 'contests' }),
  query: { phase: 'ended' },
}));
const action = computed(() => {
  if (props.isPastLastPage)
    return { to: props.firstPageTarget, labelKey: 'contests.list.empty.backToFirstPage' };
  if (isTagEmpty.value && props.clearTagTarget)
    return { to: props.clearTagTarget, labelKey: 'common.clearFilters' };
  if (showsUpcomingHint.value)
    return { to: endedTarget.value, labelKey: 'contests.list.empty.seeEnded' };
  return null;
});
const hasNext = computed(() => Boolean(props.nextContest) || isTagEmpty.value);
</script>

<template>
  <EmptyState inline data-testid="contest-list-empty">
    {{ messageText }}
    <template v-if="hasNext" #next>
      <i18n-t v-if="nextContest" keypath="contests.list.next" tag="span">
        <template #name>
          <RouterLink
            :to="{ name: 'contest', params: { key: nextContest.key } }"
            class="font-semibold text-content hover:text-accent-text hover:underline"
            >{{ nextContest.name }}</RouterLink
          >
        </template>
        <template #when
          ><span class="font-mono tabular-nums">{{
            formatDate(nextContest.startTime, 'datetime', locale.locale)
          }}</span></template
        >
      </i18n-t>
      <template v-else>{{ $t('contestTags.emptyHint') }}</template>
    </template>
    <template v-if="action" #action>
      <AppButton tone="link" :to="action.to">{{ $t(action.labelKey) }}</AppButton>
    </template>
  </EmptyState>
</template>
