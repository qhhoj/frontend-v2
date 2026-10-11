<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import InlineBit from '@/components/InlineBit.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import StateBit from '@/components/StateBit.vue';
import GlassCard from '@/components/GlassCard.vue';
import QueryState from '@/components/QueryState.vue';
import { translate } from '@/i18n';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import DensitySwitch from './DensitySwitch.vue';
import SubmissionFilterRail from './SubmissionFilterRail.vue';
import SubmissionQuickFilters from './SubmissionQuickFilters.vue';
import SubmissionStatsStrip from './SubmissionStatsStrip.vue';
import SubmissionTable from './SubmissionTable.vue';
import SubmissionTableSkeleton from './SubmissionTableSkeleton.vue';
import { describeActiveFilters } from './describe-active-filters';
import { advancedFilterCount } from './quick-filters';
import { useSubmissionListQuery, useSubmissionStatsQuery } from './submissions.queries';
import { FIRST_PAGE } from './live-passes';
import { useListDensity } from './use-list-density';
import { useLiveSubmissionList } from './use-live-submission-list';
import { useSubmissionFilters } from './use-submission-filters';
import { useSessionStore } from '@/stores/session.store';
import DiffSelectionBar from './DiffSelectionBar.vue';
import { useDiffPicks } from './use-diff-picks';

const ADVANCED_PANEL_ID = 'submission-advanced-filters';
const { filters, update, reset } = useSubmissionFilters();
const session = useSessionStore();
/** The diff page needs a signed-in viewer, so only they pick rows. */
const isSignedIn = computed(() => session.status === 'authenticated');
const username = computed(() => (isSignedIn.value ? (session.user?.username ?? null) : null));
const picks = useDiffPicks();
const density = useListDensity();
const { data: meta } = useProblemMetaQuery();
const { data: stats, isPending: isStatsPending } = useSubmissionStatsQuery();
const {
  data: list,
  isPending,
  error,
  refetch,
  isPlaceholderData,
} = useSubmissionListQuery(filters);

const advancedCount = computed(() => advancedFilterCount(filters.value, username.value));
/** A link that carries a filter only the panel shows opens with the panel open, so the filter is visible. */
const isAdvancedOpen = ref(advancedCount.value > 0);

const submissions = computed(() => list.value?.items ?? []);
const live = useLiveSubmissionList({
  filters,
  rows: submissions,
  total: computed(() => (isPlaceholderData.value ? undefined : list.value?.meta.total)),
  enabled: computed(() => filters.value.live),
  refetchRows: async () => (await refetch()).data?.items,
  goToFirstPage: () => update({ page: FIRST_PAGE }),
});
const emptyText = computed(() => {
  const active = describeActiveFilters(filters.value, meta.value?.languages ?? []);
  return active
    ? translate('submissions.emptyFiltered', { filters: active })
    : translate('submissions.empty');
});

/** Another page is a new list: bring its top (not the filters') into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
watch(
  () => filters.value.page,
  () => listTop.value?.scrollIntoView({ block: 'start' }),
);
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
    <SubmissionStatsStrip
      :stats="stats"
      :pending="isStatsPending"
      :live="filters.live"
      @update:live="update({ live: $event })"
    />
    <div class="flex flex-col gap-3">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <SubmissionQuickFilters
          :filters="filters"
          :languages="meta?.languages ?? []"
          :username="username"
          :grading-count="stats?.queueLength"
          :advanced-open="isAdvancedOpen"
          :advanced-count="advancedCount"
          :panel-id="ADVANCED_PANEL_ID"
          @update="update"
          @toggle-advanced="isAdvancedOpen = !isAdvancedOpen"
        />
        <!-- The phone's stacked rows have one density: the switch would change nothing there. -->
        <DensitySwitch v-model="density" class="max-md:hidden" />
      </div>
      <SubmissionFilterRail
        v-if="isAdvancedOpen"
        :id="ADVANCED_PANEL_ID"
        layout="panel"
        :filters="filters"
        :languages="meta?.languages ?? []"
        :show-live="false"
        :show-language="false"
        @update="update"
        @reset="reset"
      />
    </div>
    <div
      ref="listTop"
      class="flex min-w-0 scroll-mt-20 flex-col gap-3"
      :aria-busy="isPlaceholderData"
    >
      <p
        v-if="live.paused.value"
        data-testid="live-paused"
        class="flex flex-wrap items-center gap-3 text-sm text-muted"
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
        class="sticky top-20 z-10 w-fit rounded-pill bg-surface-solid"
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
      <NumberedPager
        v-if="list && submissions.length"
        :meta="list.meta"
        :label="$t('submissions.pager.top')"
        align="end"
      />
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <SubmissionTableSkeleton :has-pick-column="isSignedIn" :dense="density === 'compact'" />
        </template>
        <GlassCard v-if="!submissions.length" as="div">
          <EmptyState>{{ emptyText }}</EmptyState>
        </GlassCard>
        <SubmissionTable
          v-else
          :submissions="submissions"
          :highlight-ids="live.addedIds.value"
          :picked-ids="isSignedIn ? picks.picked.value : undefined"
          :dense="density === 'compact'"
          show-problem-code
          @toggle-pick="picks.toggle"
        />
        <DiffSelectionBar
          v-if="isSignedIn && picks.picked.value.length > 0"
          :picked="picks.picked.value"
          @clear="picks.clear()"
        />
        <NumberedPager v-if="list" :meta="list.meta" :label="$t('submissions.pager.label')" />
      </QueryState>
    </div>
  </div>
</template>
