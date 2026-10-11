<script setup lang="ts">
import { computed } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import InlineBit from '@/components/InlineBit.vue';
import QueryState from '@/components/QueryState.vue';
import StatePanel from '@/components/StatePanel.vue';
import { useProblemMetaQuery } from '@/features/problems/problems.queries';
import SubmissionFilterRail from '@/features/submissions/SubmissionFilterRail.vue';
import SubmissionStatsStrip from '@/features/submissions/SubmissionStatsStrip.vue';
import SubmissionTable from '@/features/submissions/SubmissionTable.vue';
import SubmissionTableSkeleton from '@/features/submissions/SubmissionTableSkeleton.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import { describeActiveFilters } from '@/features/submissions/describe-active-filters';
import { FIRST_PAGE } from '@/features/submissions/live-passes';
import {
  useOrganizationSubmissionListQuery,
  useSubmissionStatsQuery,
} from '@/features/submissions/submissions.queries';
import { useLiveSubmissionList } from '@/features/submissions/use-live-submission-list';
import { useSubmissionFilters } from '@/features/submissions/use-submission-filters';
import { translate } from '@/i18n';
import { usePermissions } from '@/stores/use-permissions';
import { useOrganization } from '../use-organization';
import OrgProblemPicker from './OrgProblemPicker.vue';

/** Legacy `SubmissionListOrganization`, laid out as /submissions: the site's strip, the filter rail, the members' rows. */
const { slug, query: organizationQuery } = useOrganization();
const { can } = usePermissions();
const viewer = computed(() => organizationQuery.data.value?.viewer ?? null);
/** Members and administrators pick from the organization's problems; the bypass permission alone does not open that list. */
const isInside = computed(() => Boolean(viewer.value?.isMember || viewer.value?.canAdminister));
const canRead = computed(() => isInside.value || can('judge.view_all_submission'));
const { filters, update, reset } = useSubmissionFilters();
const { data: meta } = useProblemMetaQuery();
const { data: stats, isPending: isStatsPending } = useSubmissionStatsQuery();
const {
  data: list,
  isPending,
  error,
  refetch,
  isPlaceholderData,
} = useOrganizationSubmissionListQuery(slug, filters, canRead);
const rows = computed(() => list.value?.items ?? []);
const live = useLiveSubmissionList({
  filters,
  rows,
  total: computed(() => (isPlaceholderData.value ? undefined : list.value?.meta.total)),
  enabled: computed(() => canRead.value && filters.value.live),
  refetchRows: async () => (await refetch()).data?.items,
  goToFirstPage: () => update({ page: FIRST_PAGE }),
});
const emptyText = computed(() =>
  describeActiveFilters(filters.value, meta.value?.languages ?? [])
    ? translate('orgAdmin.submissions.emptyFiltered')
    : translate('orgAdmin.submissions.empty'),
);
</script>

<template>
  <StatePanel
    v-if="organizationQuery.data.value && !canRead"
    kind="forbidden"
    :title="$t('orgAdmin.submissions.forbiddenTitle')"
  />
  <div v-else-if="organizationQuery.data.value" class="flex flex-col gap-5">
    <p role="status" aria-live="polite" class="sr-only">{{ live.announcement.value }}</p>
    <SubmissionStatsStrip
      :stats="stats"
      :pending="isStatsPending"
      :live="filters.live"
      @update:live="update({ live: $event })"
    />
    <div class="flex flex-col items-stretch gap-5 md:flex-row md:items-start">
      <SubmissionFilterRail
        :filters="filters"
        :languages="meta?.languages ?? []"
        :show-live="false"
        @update="update"
        @reset="reset"
      >
        <template v-if="isInside" #problem>
          <OrgProblemPicker
            :slug="slug"
            :code="filters.problem"
            @pick="update({ problem: $event })"
          />
        </template>
      </SubmissionFilterRail>
      <div class="flex min-w-0 flex-1 flex-col gap-3" :aria-busy="isPlaceholderData">
        <p v-if="live.paused.value" class="flex flex-wrap items-center gap-3 text-sm text-muted">
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
            class="min-h-11 rounded-pill border border-line-accent bg-accent-soft px-4 font-semibold text-accent-soft-text hover:opacity-90"
            @click="live.showNew()"
          >
            {{ $t('submissions.newPill', { count: live.newCount.value }, live.newCount.value) }}
          </button>
        </div>
        <QueryState :loading="isPending" :error="error" @retry="refetch()">
          <template #skeleton><SubmissionTableSkeleton /></template>
          <GlassCard v-if="!rows.length" as="div">
            <EmptyState>{{ emptyText }}</EmptyState>
          </GlassCard>
          <SubmissionTable
            v-else
            :submissions="rows"
            :highlight-ids="live.addedIds.value"
            show-problem-code
          />
          <NumberedPager v-if="list" :meta="list.meta" :label="$t('submissions.pager.label')" />
        </QueryState>
      </div>
    </div>
  </div>
</template>
