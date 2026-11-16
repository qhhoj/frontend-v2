<script setup lang="ts">
import { computed, TransitionGroup } from 'vue';
import { useMotionAllowed } from '@/lib/use-motion-allowed';
import type { RouteLocationRaw } from 'vue-router';
import type { Ranking, RankingRow } from '@/api/types/contests';
import RankingListRow from './RankingListRow.vue';
import type { RowView } from './ranking-row-view';

/**
 * The board on a phone (below `sm`): one line per contestant with rank, name and score. A tap on the row opens its cells under
 * the name as labelled cells (the details are folded until asked; see `RankingListRow`). The viewer's row is also kept first
 * (`pinnedRow`). It is an ordered list, not a table: rows are `li[data-row-id]` with a focusable `[data-row-focus]` name block,
 * so "Về hàng của tôi" (`focusTableRow`) works on both.
 */
const props = defineProps<{
  ranking: Ranking;
  rows: RankingRow[];
  /** What each row prints (cells, total, time), built once per board read by `RankingTable`. */
  viewOf: (row: RankingRow) => RowView;
  viewerId: string | null;
  /** The board has a penalty column on desktop: here the penalty goes under the score. */
  hasTimeColumn: boolean;
  /** Points boards with a cumulative time: it goes under the score too. */
  hasCombinedScore: boolean;
  hasRatingColumn: boolean;
  linkOf: (row: RankingRow) => RouteLocationRaw | undefined;
  /** A poll just changed the board and motion is allowed: numbers tick and rows move. */
  isTicking: boolean;
  /** The viewer's row, kept first while it is among the rows shown. */
  pinnedRow?: RankingRow | null;
}>();
const MOVE_CLASS = 'transition-transform duration-(--qh-duration) ease-move';
/** Above this many rows the rows jump instead of sliding (FLIP reads every row's box on every change). */
const FLIP_MAX_ROWS = 100;
const isMotionAllowed = useMotionAllowed();
/** The rows sit in a `TransitionGroup` whenever they may move: swapping it per poll would redraw every row and lose the change. */
const isMovable = computed(() => isMotionAllowed.value && props.rows.length <= FLIP_MAX_ROWS);
const moveClass = computed(() => (props.isTicking ? MOVE_CLASS : ''));
/** Rank, name (the rest), score: one grid for the header line and every row. */
const COLUMNS = 'grid grid-cols-[2.25rem_minmax(0,1fr)_5.5rem_2.75rem]';
const problemRange = computed(() => {
  const labels = props.ranking.problems.map((problem) => problem.label);
  return labels.length > 1 ? `${labels[0]}–${labels.at(-1)}` : (labels[0] ?? '');
});
const scoreHeaderKey = computed(() =>
  props.hasTimeColumn ? 'ranking.columns.scorePenalty' : 'ranking.columns.score',
);
const isViewer = (row: RankingRow) => row.user.id === props.viewerId;
/** What one phone row needs; the pinned copy and the row in place are built the same way. */
const rowProps = (row: RankingRow) => ({
  row,
  view: props.viewOf(row),
  isViewer: isViewer(row),
  link: props.linkOf(row),
  hasTimeColumn: props.hasTimeColumn,
  hasCombinedScore: props.hasCombinedScore,
  hasRatingColumn: props.hasRatingColumn,
  isTicking: props.isTicking,
  columns: COLUMNS,
});
</script>

<template>
  <div data-testid="ranking-list">
    <p aria-hidden="true" :class="[COLUMNS, 'py-2 text-meta font-medium text-muted']">
      <span class="px-2 text-right">#</span>
      <span class="px-2">{{ $t('ranking.columns.user') }} · {{ problemRange }}</span>
      <span class="px-2 text-right">{{ $t(scoreHeaderKey) }}</span>
      <span />
    </p>
    <ol v-if="pinnedRow" :aria-label="$t('ranking.pinned.label')">
      <RankingListRow v-bind="rowProps(pinnedRow)" pinned />
    </ol>
    <component
      :is="isMovable ? TransitionGroup : 'ol'"
      v-bind="isMovable ? { tag: 'ol', moveClass } : {}"
      :aria-label="$t('pages.ranking')"
    >
      <RankingListRow v-for="row in rows" :key="row.participationId" v-bind="rowProps(row)" />
    </component>
  </div>
</template>
