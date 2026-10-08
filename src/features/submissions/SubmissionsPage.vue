<script setup lang="ts">
import { computed, ref } from 'vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { translate } from '@/i18n';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import SubmissionFilterRail from './SubmissionFilterRail.vue';
import SubmissionPager from './SubmissionPager.vue';
import SubmissionStatsStrip from './SubmissionStatsStrip.vue';
import SubmissionStatsStripSkeleton from './SubmissionStatsStripSkeleton.vue';
import SubmissionTable from './SubmissionTable.vue';
import SubmissionTableSkeleton from './SubmissionTableSkeleton.vue';
import { describeActiveFilters } from './describe-active-filters';
import {
  SUBMISSION_PAGE_SIZE,
  useSubmissionListQuery,
  useSubmissionStatsQuery,
} from './submissions.queries';
import { useSubmissionFilters } from './use-submission-filters';

const { filters, update, reset } = useSubmissionFilters();
const { data: meta } = useProblemMetaQuery();
const { data: stats, isPending: isStatsPending } = useSubmissionStatsQuery();
const {
  data: list,
  isPending,
  error,
  refetch,
  isPlaceholderData,
} = useSubmissionListQuery(filters);

const submissions = computed(() => list.value?.items ?? []);
const emptyText = computed(() => {
  const active = describeActiveFilters(filters.value, meta.value?.languages ?? []);
  return active
    ? translate('submissions.emptyFiltered', { filters: active })
    : translate('submissions.empty');
});

/** Another page is a new list: bring its top (not the rail's) into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
function goToPage(page: number) {
  update({ page });
  listTop.value?.scrollIntoView({ block: 'start' });
}
</script>

<template>
  <div class="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-8">
    <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">
      {{ $t('submissions.title') }}
    </h1>
    <QueryState :loading="isStatsPending" :error="null">
      <template #skeleton><SubmissionStatsStripSkeleton /></template>
      <SubmissionStatsStrip :stats="stats" />
    </QueryState>
    <div class="flex flex-col items-stretch gap-5 md:flex-row md:items-start">
      <SubmissionFilterRail
        :filters="filters"
        :languages="meta?.languages ?? []"
        @update="update"
        @reset="reset"
      />
      <div ref="listTop" class="min-w-0 flex-1 scroll-mt-20" :aria-busy="isPlaceholderData">
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><SubmissionTableSkeleton /></template>
          <GlassCard v-if="!submissions.length" as="div" class="px-6 py-10 text-center text-muted">
            {{ emptyText }}
          </GlassCard>
          <SubmissionTable v-else :submissions="submissions" />
          <SubmissionPager
            :page="filters.page"
            :page-size="SUBMISSION_PAGE_SIZE"
            :total="list?.meta.total"
            :item-count="submissions.length"
            @update:page="goToPage"
          />
        </QueryState>
      </div>
    </div>
  </div>
</template>
