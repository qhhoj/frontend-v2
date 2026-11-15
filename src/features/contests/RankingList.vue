<script setup lang="ts">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { Ranking, RankingRow } from '@/api/types/contests';
import UserLink from '@/components/UserLink.vue';
import Chip from '@/components/ui/Chip.vue';
import { medalClass } from '@/lib/medal';
import { deltaToneClass, formatDelta } from '@/lib/rating-delta';
import { KIND_CLASSES, PARTIAL_CLASSES } from './ranking-cell-classes';
import { miniCellRem } from './ranking-columns';
import type { RowView } from './ranking-row-view';

/**
 * The board on a phone (below `sm`): one row per contestant with rank, name, score and a mini cell per problem, all in
 * the screen's width. The mini cells wrap instead of scrolling; each shows its problem label and its cell's short text (`A +1`, `B ?2`,
 * `C 100`) on the cell's colours, all as wide as the widest one so they line up in columns, and is read out with its problem label. It is an ordered list, not a table: rows are
 * `li[data-row-id]` with a focusable `[data-row-focus]` name block, so "Về hàng của tôi" (`focusTableRow`) works on both.
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
}>();
/** Rank, name (the rest), score: one grid for the header line and every row. */
const COLUMNS = 'grid grid-cols-[2.25rem_minmax(0,1fr)_5.5rem]';
const problemRange = computed(() => {
  const labels = props.ranking.problems.map((problem) => problem.label);
  return labels.length > 1 ? `${labels[0]}–${labels.at(-1)}` : (labels[0] ?? '');
});
const scoreHeaderKey = computed(() =>
  props.hasTimeColumn ? 'ranking.columns.scorePenalty' : 'ranking.columns.score',
);
/** One width for every mini cell of the board, so the cells line up in columns across rows. */
const miniWidth = computed(() => {
  const cells = props.rows.flatMap((row) =>
    props.viewOf(row).cells.map((cell) => ({
      label: cell.label,
      text: cell.view.kind === 'empty' ? '' : cell.view.text,
    })),
  );
  return `${miniCellRem(cells.length ? cells : props.ranking.problems.map(({ label }) => ({ label, text: '' })))}rem`;
});
const isViewer = (row: RankingRow) => row.user.id === props.viewerId;
</script>

<template>
  <div data-testid="ranking-list">
    <p aria-hidden="true" :class="[COLUMNS, 'py-2 text-meta font-medium text-muted']">
      <span class="px-2 text-right">#</span>
      <span class="px-2">{{ $t('ranking.columns.user') }} · {{ problemRange }}</span>
      <span class="px-2 text-right">{{ $t(scoreHeaderKey) }}</span>
    </p>
    <ol :aria-label="$t('pages.ranking')">
      <li
        v-for="row in rows"
        :key="row.participationId"
        :data-row-id="row.participationId"
        :class="[COLUMNS, 'border-t border-line', { 'bg-surface-hover': isViewer(row) }]"
      >
        <span
          class="px-2 py-2.5 text-right font-mono tabular-nums"
          :class="row.rank && !row.isDisqualified ? medalClass(row.rank) : ''"
        >
          <span class="sr-only">{{ $t('ranking.columns.rank') }}</span>
          {{ row.isDisqualified ? '—' : (row.rank ?? '—') }}
        </span>
        <div tabindex="-1" data-row-focus class="min-w-0 px-2 py-2">
          <span class="flex min-w-0 flex-wrap items-center gap-1.5">
            <UserLink
              :username="row.user.username"
              :rating="row.user.rating"
              :to="linkOf(row)"
              class="min-w-0 truncate"
            />
            <Chip v-if="row.virtual > 0">{{ $t('ranking.virtual') }}</Chip>
            <Chip v-if="isViewer(row)" tone="accent">{{ $t('common.you') }}</Chip>
            <Chip v-if="row.isDisqualified" tone="danger">{{ $t('ranking.disqualified') }}</Chip>
          </span>
          <span class="mt-1.5 flex flex-wrap gap-0.5">
            <span
              v-for="cell in viewOf(row).cells"
              :key="cell.problemId"
              :style="{ width: miniWidth }"
              class="inline-flex h-4.5 items-center justify-center gap-0.5 rounded-cell px-0.5 font-mono text-tiny leading-none font-semibold tabular-nums"
              :class="[
                cell.view.kind === 'empty' ? 'bg-surface-strong' : KIND_CLASSES[cell.view.kind],
                cell.view.partialStep && PARTIAL_CLASSES[cell.view.partialStep],
              ]"
              ><span aria-hidden="true" class="opacity-70">{{ cell.label }}</span
              ><span aria-hidden="true">{{ cell.view.kind === 'empty' ? '' : cell.view.text }}</span
              ><span class="sr-only"
                >{{ cell.label }}:
                {{
                  $t(
                    cell.view.labelKey,
                    cell.view.labelParams,
                    Number(cell.view.labelParams.tries ?? 1),
                  )
                }}</span
              ></span
            >
          </span>
        </div>
        <span class="px-2 py-2 text-right font-mono tabular-nums">
          <span class="sr-only">{{ $t(scoreHeaderKey) }}</span>
          <span class="block text-sm font-bold">{{
            row.isDisqualified ? '—' : viewOf(row).total
          }}</span>
          <span
            v-if="(hasTimeColumn || hasCombinedScore) && !row.isDisqualified"
            class="block text-caption text-muted"
            >{{ viewOf(row).time }}</span
          >
          <span
            v-if="hasRatingColumn && row.ratingChange"
            data-testid="rating-change"
            class="block text-caption whitespace-nowrap"
            :class="deltaToneClass(row.ratingChange.delta)"
            >{{
              row.ratingChange.delta === null
                ? row.ratingChange.rating
                : `${formatDelta(row.ratingChange.delta)} → ${row.ratingChange.rating}`
            }}</span
          >
        </span>
      </li>
    </ol>
  </div>
</template>
