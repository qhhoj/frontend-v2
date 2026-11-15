<script setup lang="ts">
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { computed, ref, TransitionGroup } from 'vue';
import { focusTableRow } from '@/lib/focus-table-row';
import { medalClass } from '@/lib/medal';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import type { Ranking, RankingProblem, RankingRow } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { deltaToneClass, formatDelta } from '@/lib/rating-delta';
import { isPenaltyFormat, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingCell from './RankingCell.vue';
import ScoreTick from './ScoreTick.vue';
import RankingList from './RankingList.vue';
import RankingProblemHeader from './RankingProblemHeader.vue';
import {
  RANK_COLUMN_REM,
  RATING_COLUMN_REM,
  problemColumnRem,
  scoreColumnRem,
  tableMinWidthRem,
  timeColumnRem,
} from './ranking-columns';
import type { StatsColumns } from './ranking-columns';
import { useLiveBoard } from './use-live-board';
import { rowViewOf } from './ranking-row-view';
import type { RowView } from './ranking-row-view';

const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  context: RankingContext;
  viewerId: string | null;
  /** Cells link to the contest's submissions of that user and problem; absent on boards that cannot (replay). */
  contestKey?: string;
  /** Problem names by problem id, shown short under each column label; absent where the board has no names. */
  problemNames?: ReadonlyMap<string, string>;
  /** The viewer may only see own submissions (backend narrows the list), so only their own row links. */
  ownSubmissionsOnly?: boolean;
  /** The rows shown are the previous board's while the new one loads: nothing ticks when it arrives. */
  isStale?: boolean;
}>();
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
const isLive = useLiveBoard(
  () => props.ranking,
  () => props.rows,
  () => props.context,
  () => props.isStale ?? false,
);
/** Numbers tick and rows move only when a poll changed the board and motion is allowed. */
const isTicking = computed(() => isLive.value && isMotionAllowed.value);
const MOVE_CLASS = 'transition-transform duration-(--qh-duration) ease-move';
/** Above this many rows the rows jump instead of sliding (FLIP reads every row's box on every change). */
const FLIP_MAX_ROWS = 100;
/** The rows sit in a `TransitionGroup` whenever they may move: swapping it per poll would redraw every row and lose the change. */
const isMovable = computed(() => isMotionAllowed.value && props.rows.length <= FLIP_MAX_ROWS);
const moveClass = computed(() => (isTicking.value ? MOVE_CLASS : ''));
/** Focuses a participation's name cell ("Về hàng của tôi"); false when the row is not shown. */
const focusRow = (participationId: string) =>
  focusTableRow(root.value, participationId, isMotionAllowed.value);
defineExpose({ focusRow });
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
/** Every row's printed texts, built once per board read for all rows, so a search does not change the columns. */
const rowViews = computed(
  () =>
    new Map(
      props.ranking.rows.map((row) => [
        row.participationId,
        rowViewOf(row, props.ranking.problems, props.context, submissionsLink),
      ]),
    ),
);
const viewOf = (row: RankingRow): RowView =>
  rowViews.value.get(row.participationId) ??
  rowViewOf(row, props.ranking.problems, props.context, submissionsLink);
/** Each column as wide as the widest text the board prints in it, so nothing is cut or drawn over the next one. */
const columns = computed<StatsColumns>(() => {
  const views = [...rowViews.value.values()];
  return {
    scoreRem: scoreColumnRem(
      views.map((view) => ({
        total: view.total,
        time: hasCombinedScore.value ? view.time : undefined,
      })),
    ),
    timeRem: hasTimeColumn.value ? timeColumnRem(views.map((view) => view.time)) : null,
    ratingRem: hasRatingColumn.value ? RATING_COLUMN_REM : null,
    problemRem: problemColumnRem(views.flatMap((view) => view.cells.map((cell) => cell.view))),
  };
});
const minWidth = computed(
  () => `${tableMinWidthRem(props.ranking.problems.length, columns.value)}rem`,
);
const scoreHeaderKey = computed(() =>
  hasCombinedScore.value ? 'ranking.columns.scoreTime' : 'ranking.columns.score',
);
</script>

<template>
  <div ref="root" class="contents">
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
      :view-of="viewOf"
      :viewer-id="viewerId"
      :has-time-column="hasTimeColumn"
      :has-combined-score="hasCombinedScore"
      :has-rating-column="hasRatingColumn"
      :link-of="submissionsLink"
      :is-ticking="isTicking"
    />
    <ScrollRegion v-else :label="$t('ranking.scrollRegion')" :hint="$t('ranking.scrollHint')">
      <table class="w-full table-fixed border-collapse" :style="{ minWidth }">
        <colgroup>
          <col :style="{ width: `${RANK_COLUMN_REM}rem` }" />
          <col />
          <col :style="{ width: `${columns.scoreRem}rem` }" />
          <col v-if="columns.timeRem" :style="{ width: `${columns.timeRem}rem` }" />
          <col v-if="columns.ratingRem" :style="{ width: `${columns.ratingRem}rem` }" />
          <col
            v-for="problem in ranking.problems"
            :key="problem.problemId"
            :style="{ width: `${columns.problemRem}rem` }"
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
              <RankingProblemHeader
                :problem="problem"
                :name="problemNames?.get(problem.problemId)"
                :contest-key="contestKey"
              />
            </th>
          </tr>
        </thead>
        <component
          :is="isMovable ? TransitionGroup : 'tbody'"
          v-bind="isMovable ? { tag: 'tbody', moveClass } : {}"
          class="font-mono text-sm tabular-nums"
        >
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
            <td class="overflow-hidden px-1.5 leading-none whitespace-nowrap">
              <span class="block text-base font-bold">
                <template v-if="row.isDisqualified">—</template>
                <ScoreTick v-else :text="viewOf(row).total" :animate="isTicking" />
              </span>
              <small
                v-if="hasCombinedScore && !row.isDisqualified"
                class="mt-0.5 block text-tiny font-normal text-muted"
                >{{ viewOf(row).time }}</small
              >
            </td>
            <td v-if="hasTimeColumn" class="overflow-hidden text-meta whitespace-nowrap text-muted">
              {{ row.isDisqualified ? '—' : viewOf(row).time }}
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
              v-for="cell in viewOf(row).cells"
              :key="cell.problemId"
              :view="cell.view"
              :to="cell.to"
              :tick="isTicking"
            />
          </tr>
        </component>
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
