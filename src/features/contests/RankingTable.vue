<script setup lang="ts">
import RankColumnHeader from '@/components/RankColumnHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import AppButton from '@/components/ui/AppButton.vue';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, TransitionGroup, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { focusTableRow } from '@/lib/focus-table-row';
import { COMPACT_LIST_QUERY, useMediaQuery } from '@/lib/use-media-query';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import type { Ranking, RankingProblem, RankingRow } from '@/api/types/contests';
import ScrollRegion from '@/components/ScrollRegion.vue';
import { isPenaltyFormat, showsCumtime } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import RankingProblemHeader from './RankingProblemHeader.vue';
import RankingTableRow from './RankingTableRow.vue';
import {
  NAME_COLUMN_PHONE_REM,
  RANK_COLUMN_PHONE_REM,
  RANK_COLUMN_REM,
  SCORE_COLUMN_PHONE_REM,
  SCORE_COLUMN_REM,
  TIME_COLUMN_PHONE_REM,
  TIME_COLUMN_REM,
  nameColumnRem,
  RATING_COLUMN_REM,
  problemColumnRem,
  scoreColumnRem,
  tableWidthRem,
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
  /** The viewer's row, kept as the first row of the board while it is among the rows shown. */
  pinnedRow?: RankingRow | null;
}>();
const penalty = computed(() => isPenaltyFormat(props.context.formatName));
const { t } = useI18n();
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
/** Below `sm` the board is the same table in its own scroll box: the name column is narrow and stays while the cells scroll. */
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
      isCompact.value ? SCORE_COLUMN_PHONE_REM : SCORE_COLUMN_REM,
    ),
    timeRem: hasTimeColumn.value
      ? timeColumnRem(
          views.map((view) => view.time),
          isCompact.value ? TIME_COLUMN_PHONE_REM : TIME_COLUMN_REM,
        )
      : null,
    ratingRem: hasRatingColumn.value ? RATING_COLUMN_REM : null,
    problemRem: problemColumnRem(views.flatMap((view) => view.cells.map((cell) => cell.view))),
  };
});
/** A name's chips (virtual, "Bạn", disqualified) sit beside it, so their texts count toward its width. */
const printedName = (row: RankingRow) =>
  [
    row.user.username,
    row.virtual > 0 ? t('ranking.virtual') : '',
    row.user.id === props.viewerId ? t('common.you') : '',
    row.isDisqualified ? t('ranking.disqualified') : '',
  ].join(' ');
const nameRem = computed(() =>
  isCompact.value ? NAME_COLUMN_PHONE_REM : nameColumnRem(props.ranking.rows.map(printedName)),
);
const rankRem = computed(() => (isCompact.value ? RANK_COLUMN_PHONE_REM : RANK_COLUMN_REM));
const tableWidth = computed(
  () =>
    `${tableWidthRem(nameRem.value, props.ranking.problems.length, columns.value, rankRem.value)}rem`,
);
/**
 * The table head sticks under the contest's bar (`top: var(--contest-bar-height)`), which needs no scroll frame around the
 * table: a frame that scrolls sideways is its own scroller and the head would stick to it, not to the page. So the table sits
 * in a plain clipped box while it fits, and in the scroll frame only when it is wider than the room (then its head scrolls with it).
 */
const SLACK_PX = 1;
const frame = ref<HTMLElement | null>(null);
const tableEl = ref<HTMLElement | null>(null);
const isScrolling = ref(false);
function measure() {
  if (frame.value && tableEl.value)
    isScrolling.value = tableEl.value.offsetWidth > frame.value.clientWidth + SLACK_PX;
}
let observer: ResizeObserver | undefined;
onMounted(() => {
  measure();
  if (typeof ResizeObserver === 'undefined' || !frame.value) return;
  observer = new ResizeObserver(measure);
  observer.observe(frame.value);
});
onBeforeUnmount(() => observer?.disconnect());
watch([tableWidth, tableEl, frame], () => void nextTick(measure));
/**
 * The head sticks under the contest's bar only while the page is the scroller. Inside the sideways scroll frame the frame
 * is the scroller, so a `top` offset would push the head down over the first row: there it keeps to its place.
 */
const headSticky = computed(
  () => `sticky bg-ground ${isScrolling.value ? '' : 'top-(--contest-bar-height,0)'}`,
);
const rankHead = computed(() => `${headSticky.value} z-10 sm:left-0 sm:z-20`);
const nameHead = computed(() => `${headSticky.value} left-0 z-20 sm:left-14`);
const otherHead = computed(() => `${headSticky.value} z-10`);
const HEAD_CELL =
  'h-(--qh-row-dense) border-b border-line-strong px-2.5 py-0 font-semibold max-sm:px-1';
/** What one board row needs; the pinned copy and the row in place are built the same way. */
const rowProps = (row: RankingRow) => ({
  row,
  view: viewOf(row),
  isViewer: row.user.id === props.viewerId,
  link: submissionsLink(row),
  hasTimeColumn: hasTimeColumn.value,
  hasCombinedScore: hasCombinedScore.value,
  hasRatingColumn: hasRatingColumn.value,
  isTicking: isTicking.value,
});
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
    <div v-else ref="frame" class="overflow-x-clip">
      <component
        :is="isScrolling ? ScrollRegion : 'div'"
        v-bind="
          isScrolling ? { label: $t('ranking.scrollRegion'), hint: $t('ranking.scrollHint') } : {}
        "
      >
        <table
          ref="tableEl"
          class="w-full table-fixed border-collapse"
          :style="{ minWidth: tableWidth }"
        >
          <colgroup>
            <col :style="{ width: `${rankRem}rem` }" />
            <col :style="{ width: `${nameRem}rem` }" />
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
            <tr class="text-center text-small text-muted">
              <th
                scope="col"
                :class="[
                  rankHead,
                  'h-(--qh-row-dense) w-14 border-b border-line-strong px-3 py-0 text-right font-medium max-sm:w-10 max-sm:px-1',
                ]"
              >
                <RankColumnHeader :label="$t('ranking.columns.rank')" />
              </th>
              <th
                scope="col"
                :class="[
                  nameHead,
                  'border-b border-line-strong px-2.5 py-0 text-left font-medium max-sm:px-1',
                ]"
              >
                {{ $t('ranking.columns.user') }}
              </th>
              <th scope="col" :class="[otherHead, HEAD_CELL]">
                {{ $t(scoreHeaderKey) }}
              </th>
              <th v-if="hasTimeColumn" scope="col" :class="[otherHead, HEAD_CELL]">
                {{ $t('ranking.columns.penalty') }}
              </th>
              <th v-if="hasRatingColumn" scope="col" :class="[otherHead, HEAD_CELL]">
                {{ $t('ranking.columns.ratingChange') }}
              </th>
              <th
                v-for="problem in ranking.problems"
                :key="problem.problemId"
                scope="col"
                :class="[otherHead, HEAD_CELL, 'px-1.5 text-content']"
              >
                <RankingProblemHeader
                  :problem="problem"
                  :name="problemNames?.get(problem.problemId)"
                  :contest-key="contestKey"
                />
              </th>
            </tr>
          </thead>
          <tbody v-if="pinnedRow" class="font-mono text-sm tabular-nums">
            <RankingTableRow v-bind="rowProps(pinnedRow)" pinned />
          </tbody>
          <component
            :is="isMovable ? TransitionGroup : 'tbody'"
            v-bind="isMovable ? { tag: 'tbody', moveClass } : {}"
            class="font-mono text-sm tabular-nums"
          >
            <RankingTableRow
              v-for="row in rows"
              :key="row.participationId"
              v-bind="rowProps(row)"
            />
          </component>
        </table>
      </component>
    </div>
    <p
      v-if="!rows.length && ranking.rows.length"
      role="status"
      data-testid="ranking-no-match"
      class="py-6 text-center text-muted"
    >
      {{ $t('ranking.noMatch') }}
    </p>
  </div>
</template>
