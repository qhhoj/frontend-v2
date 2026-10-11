<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import GlassCard from '@/components/GlassCard.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { useSessionStore } from '@/stores/session.store';
import DensitySwitch from '../DensitySwitch.vue';
import DiffSelectionBar from '../DiffSelectionBar.vue';
import SubmissionQuickFilters from '../SubmissionQuickFilters.vue';
import SubmissionStatsStrip from '../SubmissionStatsStrip.vue';
import SubmissionTable from '../SubmissionTable.vue';
import SubmissionTableSkeleton from '../SubmissionTableSkeleton.vue';
import { advancedFilterCount } from '../quick-filters';
import { ALL_COLUMN_KEYS } from '../submission-table-cells';
import type { ColumnKey } from '../submission-table-cells';
import { useSubmissionStatsQuery } from '../submissions.queries';
import { useDiffPicks } from '../use-diff-picks';
import { useListDensity } from '../use-list-density';
import LiveListNotices from './LiveListNotices.vue';
import SubmissionCardList from './SubmissionCardList.vue';
import SubmissionCardListSkeleton from './SubmissionCardListSkeleton.vue';
import SubmissionFilterPanel from './SubmissionFilterPanel.vue';
import type { ProblemPickerSource } from './problem-picker-options';
import { fixedUserOf } from './submission-scope';
import type { SubmissionScope } from './submission-scope';
import { useSubmissionList } from './use-submission-list';

/**
 * The one submission list: stats strip, quick filters, "Bộ lọc nâng cao", live notices, pagers, table and its loading,
 * empty and error states. A page passes only its scope and what differs there: the problem box's choices, the
 * judging-state boxes, the columns, the contest letters and the unfiltered empty text.
 */
const props = withDefaults(
  defineProps<{
    scope: SubmissionScope;
    /** False holds the list (a viewer the scope would refuse). */
    enabled?: boolean;
    problemSource?: ProblemPickerSource;
    showStatusGroups?: boolean;
    /** Columns to show, in table order; omitted shows all of them. */
    columnKeys?: readonly ColumnKey[];
    /** Problem code to the contest letter, shown before the name. */
    problemLabels?: Record<string, string>;
    emptyKey?: string;
  }>(),
  {
    enabled: true,
    problemSource: () => ({ kind: 'code' }),
    showStatusGroups: false,
    columnKeys: undefined,
    problemLabels: undefined,
    emptyKey: 'submissions.empty',
  },
);
const ADVANCED_PANEL_ID = 'submission-advanced-filters';
const session = useSessionStore();
const { filters, update, reset, listQuery, rows, live, languages, emptyText } = useSubmissionList({
  scope: () => props.scope,
  enabled: () => props.enabled,
  emptyKey: () => props.emptyKey,
});
const { data: list, isPending, error, refetch, isPlaceholderData } = listQuery;
const { data: stats, isPending: isStatsPending } = useSubmissionStatsQuery();
/** The diff page needs a signed-in viewer, so only they pick rows. */
const isSignedIn = computed(() => session.status === 'authenticated');
const hasFixedUser = computed(() => fixedUserOf(props.scope) !== null);
/** "Của tôi" needs the viewer's name, and means nothing when the scope already shows only one user. */
const chipUsername = computed(() =>
  isSignedIn.value && !hasFixedUser.value ? (session.user?.username ?? null) : null,
);
const picks = useDiffPicks();
const density = useListDensity();
const advancedCount = computed(() => advancedFilterCount(filters.value, chipUsername.value));
/** A link that carries a filter only the panel shows opens with the panel open, so the filter is visible. */
const isAdvancedOpen = ref(advancedCount.value > 0);

/** Another page is a new list: bring its top (not the filters') into view, below the shell's header. */
const listTop = ref<HTMLElement | null>(null);
watch(
  () => filters.value.page,
  () => listTop.value?.scrollIntoView({ block: 'start' }),
);
</script>

<template>
  <div class="flex min-w-0 flex-col gap-5">
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
          :languages="languages"
          :username="chipUsername"
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
      <SubmissionFilterPanel
        v-if="isAdvancedOpen"
        :id="ADVANCED_PANEL_ID"
        :filters="filters"
        :problem-source="problemSource"
        :show-user="!hasFixedUser"
        :show-status-groups="showStatusGroups"
        @update="update"
        @reset="reset"
      />
    </div>
    <div
      ref="listTop"
      class="flex min-w-0 scroll-mt-20 flex-col gap-3"
      :aria-busy="isPlaceholderData"
    >
      <LiveListNotices
        :paused="live.paused.value"
        :new-count="live.newCount.value"
        @reconnect="live.reconnect()"
        @show-new="live.showNew()"
      />
      <NumberedPager
        v-if="list && rows.length"
        :meta="list.meta"
        :label="$t('submissions.pager.top')"
        align="end"
      />
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton>
          <SubmissionCardListSkeleton v-if="density === 'comfortable'" />
          <SubmissionTableSkeleton
            v-else
            :has-pick-column="isSignedIn"
            dense
            :column-keys="columnKeys"
          />
        </template>
        <GlassCard v-if="!rows.length" as="div">
          <EmptyState>{{ emptyText }}</EmptyState>
        </GlassCard>
        <SubmissionCardList
          v-else-if="density === 'comfortable'"
          :submissions="rows"
          :columns="columnKeys ?? ALL_COLUMN_KEYS"
          :highlight-ids="live.addedIds.value"
          :problem-labels="problemLabels ?? {}"
          :picked-ids="isSignedIn ? picks.picked.value : undefined"
          @toggle-pick="picks.toggle"
        />
        <SubmissionTable
          v-else
          dense
          :submissions="rows"
          :highlight-ids="live.addedIds.value"
          :picked-ids="isSignedIn ? picks.picked.value : undefined"
          :column-keys="columnKeys"
          :problem-labels="problemLabels"
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
