<script setup lang="ts">
import { computed } from 'vue';
import type { ContestPhase } from '@/api/types/contests';
import QueryState from '@/components/QueryState.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useContestListQuery } from './contests.queries';
import ContestListSkeletons from './ContestListSkeletons.vue';
import RunningContestCard from './RunningContestCard.vue';
import { groupQuery, toContestListLocation } from './use-contest-list-filters';
import type { ContestListFilters } from './use-contest-list-filters';

const props = defineProps<{ phase: ContestPhase; filters: ContestListFilters }>();
const locale = useLocaleStore();
const query = computed(() => groupQuery(props.filters, props.phase));
const { data: list, isPending, error, refetch } = useContestListQuery(query);
const contests = computed(() => list.value?.items ?? []);
const total = computed(() => list.value?.meta.total ?? 0);
const isSingleGroup = computed(() => props.filters.phase === props.phase);
/** "Only this group" from the overview, "all groups" back from it; the search and rated filter stay. */
const toggleTarget = computed(() => ({
  name: 'contests',
  query: toContestListLocation({
    ...props.filters,
    phase: isSingleGroup.value ? null : props.phase,
    page: 1,
  }),
}));
const headingId = computed(() => `contest-group-${props.phase}`);
</script>

<template>
  <section :aria-labelledby="headingId" class="flex flex-col gap-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h2 :id="headingId" class="flex items-center gap-2.5 font-display text-2xl font-semibold">
        {{ $t(`contests.phase.${phase}`) }}
        <span class="rounded-pill bg-surface-hover px-2.5 text-sm font-semibold">{{
          formatNumber(total, locale.locale)
        }}</span>
      </h2>
      <RouterLink
        :to="toggleTarget"
        class="inline-flex min-h-11 items-center text-accent-text underline"
      >
        {{ isSingleGroup ? $t('contests.list.allGroups') : $t('contests.list.onlyGroup') }}
      </RouterLink>
    </div>
    <QueryState :loading="isPending" :error="error" @retry="refetch()">
      <template #skeleton><ContestListSkeletons :kind="phase" /></template>
      <div v-if="phase === 'running'" class="grid gap-4 lg:grid-cols-2">
        <RunningContestCard v-for="contest in contests" :key="contest.key" :contest="contest" />
      </div>
    </QueryState>
  </section>
</template>
