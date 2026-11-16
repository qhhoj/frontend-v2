<script setup lang="ts">
import { ChevronDown, Star } from 'lucide-vue-next';
import { ref } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import type { RankingRow } from '@/api/types/contests';
import UserLink from '@/components/UserLink.vue';
import Chip from '@/components/ui/Chip.vue';
import IconButton from '@/components/ui/IconButton.vue';
import { MEDAL_BADGE_SHAPE, medalBadgeClass } from '@/lib/medal';
import { deltaTone, formatDelta } from '@/lib/rating-delta';
import ScoreTick from './ScoreTick.vue';
import { TABLE_CELL_CLASSES } from './ranking-cell-classes';
import type { RowView } from './ranking-row-view';

/**
 * One contestant on the phone board: rank, name and score on a line. A tap on the row opens the cells under it, a grid of
 * labelled cells (the problem's label over the cell's short text, `+1`, `?2`, `100`, on the cell's colours; a problem
 * without a try is a dashed empty box). Each open cell is read out with its problem label. The viewer's row has an accent edge;
 * the pinned copy (`pinned`) has no `data-row-id`, so "Về hàng của tôi" still lands on the row in place.
 */
defineProps<{
  row: RankingRow;
  view: RowView;
  isViewer: boolean;
  pinned?: boolean;
  link?: RouteLocationRaw;
  /** The board has a penalty column on desktop: here the penalty goes under the score. */
  hasTimeColumn: boolean;
  /** Points boards with a cumulative time: it goes under the score too. */
  hasCombinedScore: boolean;
  hasRatingColumn: boolean;
  isTicking: boolean;
  /** Rank, name (the rest), score, chevron: one grid for the header line and every row. */
  columns: string;
}>();
const isOpen = ref(false);
/** A tap on the row opens it; a tap on the name link or the button keeps its own action. */
function onRowClick(event: MouseEvent) {
  if (!(event.target as Element).closest('a, button')) isOpen.value = !isOpen.value;
}
</script>

<template>
  <li
    :data-row-id="pinned ? undefined : row.participationId"
    :data-pinned="pinned ? '' : undefined"
    :class="[
      columns,
      'border-b border-l-2',
      pinned ? 'border-b-line-strong' : 'border-b-line',
      isViewer ? 'border-l-accent bg-surface-hover' : 'border-l-transparent',
    ]"
    @click="onRowClick"
  >
    <span class="px-2 py-2 text-right font-mono tabular-nums">
      <span class="sr-only">{{ $t('ranking.columns.rank') }}</span>
      <span
        :class="
          row.rank && !row.isDisqualified ? [MEDAL_BADGE_SHAPE, medalBadgeClass(row.rank)] : ''
        "
        >{{ row.isDisqualified ? '—' : (row.rank ?? '—') }}</span
      >
    </span>
    <div tabindex="-1" data-row-focus class="min-w-0 px-2 py-2">
      <span class="flex min-w-0 flex-wrap items-center gap-1.5">
        <UserLink
          :username="row.user.username"
          :rating="row.user.rating"
          :to="link"
          plain-avatar
          class="min-w-0 truncate [&_a]:font-medium"
        />
        <Chip v-if="row.virtual > 0">{{ $t('ranking.virtual') }}</Chip>
        <Chip v-if="isViewer" tone="accent">{{ $t('common.you') }}</Chip>
        <Chip v-if="row.isDisqualified" tone="danger">{{ $t('ranking.disqualified') }}</Chip>
      </span>
    </div>
    <span class="px-2 py-2 text-right font-mono tabular-nums">
      <span class="sr-only">{{
        $t(hasTimeColumn ? 'ranking.columns.scorePenalty' : 'ranking.columns.score')
      }}</span>
      <span class="block text-sm font-bold"
        ><ScoreTick :text="row.isDisqualified ? '—' : view.total" :animate="isTicking"
      /></span>
      <span
        v-if="(hasTimeColumn || hasCombinedScore) && !row.isDisqualified"
        class="block text-caption text-muted"
        >{{ view.time }}</span
      >
      <Chip
        v-if="hasRatingColumn && row.ratingChange"
        data-testid="rating-change"
        :tone="deltaTone(row.ratingChange.delta)"
        class="mt-0.5 whitespace-nowrap"
        >{{
          row.ratingChange.delta === null
            ? row.ratingChange.rating
            : `${formatDelta(row.ratingChange.delta)} → ${row.ratingChange.rating}`
        }}</Chip
      >
    </span>
    <span class="flex items-start justify-center pt-0.5">
      <IconButton
        :label="$t(isOpen ? 'ranking.hideProblems' : 'ranking.showProblems')"
        :aria-expanded="isOpen"
        @click="isOpen = !isOpen"
      >
        <ChevronDown
          aria-hidden="true"
          class="size-4 transition-transform duration-(--qh-duration) ease-move"
          :class="isOpen && 'rotate-180'"
        />
      </IconButton>
    </span>
    <span v-if="isOpen" class="col-start-2 col-end-5 flex flex-wrap gap-x-1 gap-y-2 px-2 pb-3">
      <span v-for="cell in view.cells" :key="cell.problemId" class="flex w-16 flex-col gap-0.5">
        <span aria-hidden="true" class="text-center text-small text-muted">{{ cell.label }}</span>
        <span
          class="relative flex h-(--qh-chip) items-center justify-center rounded-cell font-mono text-small leading-none font-semibold tabular-nums"
          :class="
            cell.view.kind === 'empty'
              ? 'border border-dashed border-line bg-surface-strong'
              : TABLE_CELL_CLASSES[cell.view.kind]
          "
          ><Star
            v-if="cell.view.kind === 'first-solve'"
            aria-hidden="true"
            class="absolute top-0.5 right-0.5 size-2.5 text-cue-full"
          /><ScoreTick
            aria-hidden="true"
            :text="cell.view.kind === 'empty' ? '' : cell.view.text"
            :animate="isTicking"
          /><span class="sr-only"
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
    </span>
  </li>
</template>
