<script setup lang="ts">
import { computed, ref } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import InlineBit from '@/components/InlineBit.vue';
import StateBit from '@/components/StateBit.vue';
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
import { FIRST_PAGE } from './live-passes';
import { useLiveSubmissionList } from './use-live-submission-list';
import { useSubmissionFilters } from './use-submission-filters';
import { useSessionStore } from '@/stores/session.store';
import DiffSelectionBar from './DiffSelectionBar.vue';
import { useDiffPicks } from './use-diff-picks';

const { filters, update, reset } = useSubmissionFilters();
const session = useSessionStore();
/** The diff page needs a signed-in viewer, so only they pick rows. */
const isSignedIn = computed(() => session.status === 'authenticated');
const picks = useDiffPicks();
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
const live = useLiveSubmissionList({
  filters,
  rows: submissions,
  total: computed(() => (isPlaceholderData.value ? undefined : list.value?.meta.total)),
  enabled: computed(() => filters.value.live),
  refetchRows: async () => (await refetch()).data?.items,
  goToFirstPage: () => goToPage(FIRST_PAGE),
});
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
  <div class="page-column">
    <div class="flex items-center justify-between gap-3">
      <h1 class="page-title">
        {{ $t('submissions.title') }}
      </h1>
      <StateBit variant="judging" size="inline" class="shrink-0" />
    </div>
    <p role="status" aria-live="polite" class="sr-only">{{ live.announcement.value }}</p>
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
        <p
          v-if="live.paused.value"
          data-testid="live-paused"
          class="mb-3 flex flex-wrap items-center gap-3 text-sm text-muted"
        >
          <InlineBit kind="sweat" />
          {{ $t('submissions.livePaused') }}
          <button
            type="button"
            class="min-h-11 rounded-pill border border-line px-4 font-semibold text-content hover:bg-surface-hover"
            @click="live.reconnect()"
          >
            {{ $t('submissions.liveReload') }}
          </button>
        </p>
        <div
          v-if="live.newCount.value > 0"
          class="sticky top-20 z-10 mb-3 w-fit rounded-pill bg-surface-solid"
        >
          <button
            type="button"
            data-testid="new-pill"
            class="min-h-11 rounded-pill border border-line-accent bg-accent-soft px-4 font-semibold text-accent-soft-text hover:opacity-90"
            @click="live.showNew()"
          >
            {{ $t('submissions.newPill', { count: live.newCount.value }, live.newCount.value) }}
          </button>
        </div>
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><SubmissionTableSkeleton :has-pick-column="isSignedIn" /></template>
          <GlassCard v-if="!submissions.length" as="div">
            <EmptyState>{{ emptyText }}</EmptyState>
          </GlassCard>
          <SubmissionTable
            v-else
            :submissions="submissions"
            :highlight-ids="live.addedIds.value"
            :picked-ids="isSignedIn ? picks.picked.value : undefined"
            @toggle-pick="picks.toggle"
          />
          <DiffSelectionBar
            v-if="isSignedIn && picks.picked.value.length > 0"
            class="mt-3"
            :picked="picks.picked.value"
            @clear="picks.clear()"
          />
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
