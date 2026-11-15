<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { computed, ref } from 'vue';
import { focusTableRow } from '@/lib/focus-table-row';
import { medalClass } from '@/lib/medal';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import type { Ranking, RankingProblem, RankingRow } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { deltaToneClass, formatDelta } from '@/lib/rating-delta';
import {
  formatCumtime,
  isPenaltyFormat,
  rankingCell,
  showsCumtime,
  totalScoreText,
} from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingCell from './RankingCell.vue';
import RankingLegend from './RankingLegend.vue';
import RankingList from './RankingList.vue';
import RankingProblemHeader from './RankingProblemHeader.vue';
import {
  PROBLEM_COLUMN_REM,
  RANK_COLUMN_REM,
  RATING_COLUMN_REM,
  SCORE_COLUMN_REM,
  TIME_COLUMN_REM,
  TIMED_POINTS_COLUMN_REM,
  tableMinWidthRem,
} from './ranking-columns';

const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  context: RankingContext;
  viewerId: string | null;
  /** Cells link to the contest's submissions of that user and problem; absent on boards that cannot (replay). */
  contestKey?: string;
  /** The viewer may only see own submissions (backend narrows the list), so only their own row links. */
  ownSubmissionsOnly?: boolean;
  /** Why cells show "?" while the board is frozen: a line in "Chú giải". */
  freezeNote?: string;
}>();
defineSlots<{ tools?: () => unknown }>();
/** Rank and name stay while the problem columns scroll (the rank column is `RANK_COLUMN_REM` = 5 rem = `left-20`). */
const RANK_STICKY = 'sticky left-0 z-10 bg-surface-solid';
/** Name sticks next to the rank while the problem columns scroll. */
const NAME_STICKY = 'sticky left-20 z-10 bg-surface-solid';
/** The viewer's row keeps its tint over the opaque sticky cells. */
const stickyBackground = (row: RankingRow) =>
  row.user.id === props.viewerId ? 'bg-linear-to-b from-surface-hover to-surface-hover' : '';
const penalty = computed(() => isPenaltyFormat(props.context.formatName));
const root = ref<HTMLElement | null>(null);
const isMotionAllowed = useMotionAllowed();
/** Focuses a participation's name cell ("Về hàng của tôi"); false when the row is not shown. */
const focusRow = (participationId: string) =>
  focusTableRow(root.value, participationId, isMotionAllowed.value);
defineExpose({ focusRow });
const hasVirtualRows = computed(() => props.rows.some((row) => row.virtual > 0));
const cellsOf = (row: RankingRow) =>
  props.ranking.problems.map((problem) => ({
    problemId: problem.problemId,
    to: submissionsLink(row, problem),
    view: rankingCell(row.cells[problem.problemId], problem, row.participationId, props.context),
  }));
/** Contest submissions of one user (and problem); undefined where the viewer may not see them. */
const submissionsLink = (row: RankingRow, problem?: RankingProblem) => {
  if (!props.contestKey) return undefined;
  if (props.ownSubmissionsOnly && row.user.id !== props.viewerId) return undefined;
  return {
    name: 'contest-submissions',
    params: { key: props.contestKey },
    query: { user: row.user.username, problem: problem?.code },
  };
};
/** Below `sm` the board is a list in the screen's width; only one of the two is rendered, so 600 rows are not drawn twice. */
const isCompact = useMediaQuery(COMPACT_LIST_QUERY);
/** Points boards print the cumulative time beside the score; penalty boards keep Score and Penalty. */
const hasCombinedScore = computed(
  () => !penalty.value && props.context.showsTime && showsCumtime(props.context.formatName),
);
const hasTimeColumn = computed(() => penalty.value && showsCumtime(props.context.formatName));
/** Rated contests carry each row's rating change once the ratings are applied. */
const hasRatingColumn = computed(() => props.ranking.rows.some((row) => row.ratingChange));
const ratingRem = computed(() => (hasRatingColumn.value ? RATING_COLUMN_REM : 0));
/** A points cell with a time needs the wider column to stay on one line. */
const problemRem = computed(() =>
  !penalty.value && props.context.showsTime ? TIMED_POINTS_COLUMN_REM : PROBLEM_COLUMN_REM,
);
const minWidth = computed(
  () =>
    `${tableMinWidthRem(props.ranking.problems.length, hasTimeColumn.value, problemRem.value) + ratingRem.value}rem`,
);
const scoreHeaderKey = computed(() =>
  hasCombinedScore.value ? 'ranking.columns.scoreTime' : 'ranking.columns.score',
);
</script>

<template>
  <div ref="root" class="contents">
    <div
      data-testid="ranking-toolbar"
      class="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2"
    >
      <slot name="tools" />
      <div class="ml-auto">
        <RankingLegend
          :is-penalty="penalty"
          :shows-time="context.showsTime"
          :has-virtual-rows="hasVirtualRows"
          :freeze-note="freezeNote"
        />
      </div>
    </div>
    <EmptyState v-if="!ranking.rows.length">
      {{ $t('ranking.empty') }}
      <template v-if="contestKey" #action>
        <AppButton tone="secondary" :to="{ name: 'contest', params: { key: contestKey } }">
          {{ $t('ranking.emptyAction') }}
        </AppButton>
      </template>
    </EmptyState>
    <RankingList
      v-else-if="isCompact"
      :ranking="ranking"
      :rows="rows"
      :context="context"
      :viewer-id="viewerId"
      :has-time-column="hasTimeColumn"
      :has-combined-score="hasCombinedScore"
      :has-rating-column="hasRatingColumn"
      :link-of="submissionsLink"
    />
    <ScrollRegion v-else :label="$t('ranking.scrollRegion')" :hint="$t('ranking.scrollHint')">
      <table class="w-full table-fixed border-collapse" :style="{ minWidth }">
        <colgroup>
          <col :style="{ width: `${RANK_COLUMN_REM}rem` }" />
          <col />
          <col :style="{ width: `${SCORE_COLUMN_REM}rem` }" />
          <col v-if="hasTimeColumn" :style="{ width: `${TIME_COLUMN_REM}rem` }" />
          <col v-if="hasRatingColumn" :style="{ width: `${RATING_COLUMN_REM}rem` }" />
          <col
            v-for="problem in ranking.problems"
            :key="problem.problemId"
            :style="{ width: `${problemRem}rem` }"
          />
        </colgroup>
        <caption class="sr-only">
          {{
            $t('pages.ranking')
          }}
        </caption>
        <thead>
          <tr class="text-center text-meta text-muted">
            <th scope="col" :class="[RANK_STICKY, 'w-14 px-3 py-2.5 text-right font-medium']">
              <RankColumnHeader :label="$t('ranking.columns.rank')" />
            </th>
            <th scope="col" :class="[NAME_STICKY, 'px-2.5 py-2.5 text-left font-medium']">
              {{ $t('ranking.columns.user') }}
            </th>
            <th scope="col" class="px-2.5 py-2.5 font-medium">
              {{ $t(scoreHeaderKey) }}
            </th>
            <th v-if="hasTimeColumn" scope="col" class="px-2.5 py-2.5 font-medium">
              {{ $t('ranking.columns.penalty') }}
            </th>
            <th v-if="hasRatingColumn" scope="col" class="px-2.5 py-2.5 font-medium">
              {{ $t('ranking.columns.ratingChange') }}
            </th>
            <th
              v-for="problem in ranking.problems"
              :key="problem.problemId"
              scope="col"
              class="px-1.5 py-2.5 font-bold text-content"
            >
              <RankingProblemHeader :problem="problem" :contest-key="contestKey" />
            </th>
          </tr>
        </thead>
        <tbody class="font-mono text-sm tabular-nums">
          <tr
            v-for="row in rows"
            :key="row.participationId"
            :data-row-id="row.participationId"
            class="border-t border-line text-center"
            :class="{ 'bg-surface-hover': row.user.id === viewerId }"
          >
            <td
              class="h-(--qh-row-dense) w-14 px-3 py-0 text-right"
              :class="[
                RANK_STICKY,
                stickyBackground(row),
                row.rank && !row.isDisqualified ? medalClass(row.rank) : '',
              ]"
            >
              {{ row.isDisqualified ? '—' : (row.rank ?? '—') }}
            </td>
            <th
              scope="row"
              tabindex="-1"
              class="overflow-hidden px-2.5 py-0 text-left font-body"
              :class="[NAME_STICKY, stickyBackground(row)]"
            >
              <span class="flex items-center gap-2 whitespace-nowrap">
                <UserLink
                  :username="row.user.username"
                  :rating="row.user.rating"
                  :to="submissionsLink(row)"
                  class="min-w-0 truncate"
                />
                <Chip v-if="row.virtual > 0">{{ $t('ranking.virtual') }}</Chip>
                <Chip v-if="row.user.id === viewerId" tone="accent">{{ $t('common.you') }}</Chip>
                <Chip v-if="row.isDisqualified" tone="danger">{{
                  $t('ranking.disqualified')
                }}</Chip>
              </span>
            </th>
            <td class="px-1.5 whitespace-nowrap">
              <span class="font-bold">
                <template v-if="row.isDisqualified">—</template>
                <template v-else>{{
                  totalScoreText(row.score, ranking.problems, context)
                }}</template>
              </span>
              <small
                v-if="hasCombinedScore && !row.isDisqualified"
                class="ml-1 text-tiny font-medium text-muted"
                >{{ formatCumtime(context.formatName, row.cumtime, context.locale) }}</small
              >
            </td>
            <td v-if="hasTimeColumn">
              {{
                row.isDisqualified
                  ? '—'
                  : formatCumtime(context.formatName, row.cumtime, context.locale)
              }}
            </td>
            <td
              v-if="hasRatingColumn"
              data-testid="rating-change"
              class="px-2.5 whitespace-nowrap"
              :class="deltaToneClass(row.ratingChange?.delta ?? null)"
            >
              <template v-if="!row.ratingChange">—</template>
              <template v-else-if="row.ratingChange.delta === null">{{
                row.ratingChange.rating
              }}</template>
              <template v-else
                >{{ formatDelta(row.ratingChange.delta) }} → {{ row.ratingChange.rating }}</template
              >
            </td>
            <RankingCell
              v-for="cell in cellsOf(row)"
              :key="cell.problemId"
              :view="cell.view"
              :to="cell.to"
            />
          </tr>
        </tbody>
      </table>
    </ScrollRegion>
    <p
      v-if="!rows.length && ranking.rows.length"
      role="status"
      data-testid="ranking-no-match"
      class="border-t border-line px-5 py-6 text-center text-muted"
    >
      {{ $t('ranking.noMatch') }}
    </p>
  </div>
</template>
