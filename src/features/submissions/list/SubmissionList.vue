<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import EmptyState from '@/components/EmptyState.vue';
import Card from '@/components/ui/Card.vue';
import NumberedPager from '@/components/NumberedPager.vue';
import QueryState from '@/components/QueryState.vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { useSessionStore } from '@/stores/session.store';
import DiffSelectionBar from '../DiffSelectionBar.vue';
import LiveToggle from '../LiveToggle.vue';
import SubmissionQuickFilters from '../SubmissionQuickFilters.vue';
import SubmissionStatsStrip from '../SubmissionStatsStrip.vue';
import { advancedFilterCount } from '../quick-filters';
import { ALL_COLUMN_KEYS } from '../submission-table-cells';
import type { ColumnKey } from '../submission-table-cells';
import { useSubmissionStatsQuery } from '../submissions.queries';
import { useDiffPicks } from '../use-diff-picks';
import LiveListNotices from './LiveListNotices.vue';
import SubmissionCardList from './SubmissionCardList.vue';
import SubmissionCardListSkeleton from './SubmissionCardListSkeleton.vue';
import SubmissionFilterPanel from './SubmissionFilterPanel.vue';
import type { ProblemPickerSource } from './problem-picker-options';
import { fixedUserOf } from './submission-scope';
import type { SubmissionScope } from './submission-scope';
import { useSubmissionList } from './use-submission-list';

/**
 * The one submission list: stats strip, quick filters, "Bộ lọc nâng cao", live notices, the list, its pager at the foot, and its loading,
 * empty and error states. A page passes only its scope and what differs there: the problem box's choices, the
 * judging-state boxes, the columns and the unfiltered empty text. A contest's problem box also gives the rows their
 * letters and contest scores. The contest tab drops the site-wide stats (`showStats`); the live pill moves beside the chips.
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
    emptyKey?: string;
    showStats?: boolean;
  }>(),
  {
    enabled: true,
    problemSource: () => ({ kind: 'code' }),
    showStatusGroups: false,
    columnKeys: undefined,
    emptyKey: 'submissions.empty',
    showStats: true,
  },
);
const ADVANCED_PANEL_ID = 'submission-advanced-filters';
const session = useSessionStore();
const locale = useLocaleStore();
const { filters, update, reset, listQuery, rows, live, languages, emptyText } = useSubmissionList({
  scope: () => props.scope,
  enabled: () => props.enabled,
  emptyKey: () => props.emptyKey,
});
const { data: list, isPending, error, refetch, isPlaceholderData } = listQuery;
const { data: stats, isPending: isStatsPending } = useSubmissionStatsQuery(() => props.showStats);
/** The diff page needs a signed-in viewer, so only they pick rows. */
const isSignedIn = computed(() => session.status === 'authenticated');
const hasFixedUser = computed(() => fixedUserOf(props.scope) !== null);
/** "Của tôi" needs the viewer's name, and means nothing when the scope already shows only one user. */
const chipUsername = computed(() =>
  isSignedIn.value && !hasFixedUser.value ? (session.user?.username ?? null) : null,
);
/** "Của tôi" on: every row is the viewer's own, so the rows leave the name out and the run time keeps its room. */
const isOwnList = computed(
  () => chipUsername.value !== null && filters.value.user === chipUsername.value,
);
const shownColumns = computed(() => {
  const columns = props.columnKeys ?? ALL_COLUMN_KEYS;
  return isOwnList.value ? columns.filter((key) => key !== 'user') : columns;
});
const picks = useDiffPicks();
/** Q-04 C: the rows' compare boxes wait behind "So sánh"; turning it off drops the picks. */
const isComparing = ref(false);
const toggleCompare = () => {
  isComparing.value = !isComparing.value;
  if (!isComparing.value) picks.clear();
};
/** "Bài nộp của bạn · 12 bài" over the viewer's whole own list (no other filter), once its own page has loaded. */
const mineTotal = computed(() => {
  const { problem, user, results, languageIds, statusGroups } = filters.value;
  const isAllMine =
    chipUsername.value !== null &&
    user === chipUsername.value &&
    !problem &&
    !results.length &&
    !languageIds.length &&
    !statusGroups.length;
  const meta = isPlaceholderData.value ? undefined : list.value?.meta;
  return isAllMine && meta && 'total' in meta ? meta.total : null;
});
const advancedCount = computed(() => advancedFilterCount(filters.value, chipUsername.value));
/** A link that carries a filter only the panel shows opens with the panel open, so the filter is visible. */
const isAdvancedOpen = ref(advancedCount.value > 0);
const toggleAdvanced = () => (isAdvancedOpen.value = !isAdvancedOpen.value);
/** A contest's problems by code, for the rows' letters and contest scores; empty for any other scope. */
const contestProblems = computed(() =>
  props.problemSource.kind === 'contest'
    ? Object.fromEntries(
        props.problemSource.problems.map(({ code, label, points }) => [code, { label, points }]),
      )
    : {},
);

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
      v-if="showStats"
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
          :comparing="isSignedIn ? isComparing : null"
          @update="update"
          @toggle-advanced="toggleAdvanced"
          @toggle-compare="toggleCompare"
        />
        <!-- Without the stats strip its live pill moves here, so a list opened with live=0 can follow again. -->
        <LiveToggle
          v-if="!showStats"
          :live="filters.live"
          @update:live="update({ live: $event })"
        />
      </div>
      <SubmissionFilterPanel
        v-if="isAdvancedOpen"
        :id="ADVANCED_PANEL_ID"
        :filters="filters"
        :problem-source="problemSource"
        :show-user="!hasFixedUser"
        :show-status-groups="showStatusGroups"
        :languages="languages"
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
        class="max-md:hidden"
        :meta="list.meta"
        :label="$t('submissions.pager.top')"
        align="end"
      />
      <p v-if="mineTotal !== null" data-testid="mine-summary" class="text-meta text-muted">
        {{ $t('submissions.mineSummary', { count: formatNumber(mineTotal, locale.locale) }) }}
      </p>
      <QueryState :loading="isPending" :error="error" @retry="refetch()">
        <template #skeleton><SubmissionCardListSkeleton /></template>
        <Card v-if="!rows.length" as="div">
          <EmptyState>
            {{ emptyText }}
            <template v-if="$slots.emptyAction" #action
              ><slot name="emptyAction" :filters="filters"
            /></template>
          </EmptyState>
        </Card>
        <SubmissionCardList
          v-else
          :submissions="rows"
          :columns="shownColumns"
          :highlight-ids="live.addedIds.value"
          :contest-problems="contestProblems"
          :picked-ids="isSignedIn && isComparing ? picks.picked.value : undefined"
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
