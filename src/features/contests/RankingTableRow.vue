<script setup lang="ts">
import type { RouteLocationRaw } from 'vue-router';
import type { RankingRow } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import UserLink from '@/components/UserLink.vue';
import { MEDAL_BADGE_SHAPE, medalBadgeClass } from '@/lib/medal';
import { deltaTone, formatDelta } from '@/lib/rating-delta';
import RankingCell from './RankingCell.vue';
import ScoreTick from './ScoreTick.vue';
import type { RowView } from './ranking-row-view';

/**
 * One row of the desktop board. The viewer's own row is tinted with an accent edge; the pinned copy above the board
 * (`pinned`) looks the same but has no `data-row-id`, so "Hàng của tôi" still lands on the row in place.
 */
defineProps<{
  row: RankingRow;
  view: RowView;
  isViewer: boolean;
  /** The copy kept at the top of the board: a rule under it, and not a target of `focusTableRow`. */
  pinned?: boolean;
  link?: RouteLocationRaw;
  hasTimeColumn: boolean;
  hasCombinedScore: boolean;
  hasRatingColumn: boolean;
  isTicking: boolean;
}>();
/** Rank and name stay while the problem columns scroll (the rank column is `RANK_COLUMN_REM` = 3.5 rem = `left-14`). */
const RANK_STICKY = 'sticky left-0 z-10 bg-ground';
const NAME_STICKY = 'sticky left-14 z-10 bg-ground';
/** The viewer's row keeps its tint over the opaque sticky cells. */
const VIEWER_TINT = 'bg-linear-to-b from-surface-hover to-surface-hover';
/** Every row keeps the edge's width so the viewer's accent does not shift the rank. */
const EDGE = 'border-l-2';
</script>

<template>
  <tr
    :data-row-id="pinned ? undefined : row.participationId"
    :data-pinned="pinned ? '' : undefined"
    class="border-b text-center"
    :class="[pinned ? 'border-line-strong' : 'border-line', { 'bg-surface-hover': isViewer }]"
  >
    <td
      class="h-(--qh-row-dense) w-14 px-3 py-0 text-right"
      :class="[RANK_STICKY, EDGE, isViewer ? ['border-accent', VIEWER_TINT] : 'border-transparent']"
    >
      <span
        :class="
          row.rank && !row.isDisqualified ? [MEDAL_BADGE_SHAPE, medalBadgeClass(row.rank)] : ''
        "
        >{{ row.isDisqualified ? '—' : (row.rank ?? '—') }}</span
      >
    </td>
    <th
      scope="row"
      tabindex="-1"
      class="overflow-hidden px-2.5 py-0 text-left font-body"
      :class="[NAME_STICKY, isViewer && VIEWER_TINT]"
    >
      <span class="flex items-center gap-2 whitespace-nowrap">
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
    </th>
    <td class="overflow-hidden px-1.5 leading-none whitespace-nowrap">
      <span class="block text-base font-bold">
        <template v-if="row.isDisqualified">—</template>
        <ScoreTick v-else :text="view.total" :animate="isTicking" />
      </span>
      <small
        v-if="hasCombinedScore && !row.isDisqualified"
        class="mt-1 block text-tiny font-normal text-muted"
        >{{ view.time }}</small
      >
    </td>
    <td v-if="hasTimeColumn" class="overflow-hidden text-meta whitespace-nowrap text-muted">
      {{ row.isDisqualified ? '—' : view.time }}
    </td>
    <td v-if="hasRatingColumn" data-testid="rating-change" class="px-2.5 whitespace-nowrap">
      <template v-if="!row.ratingChange">—</template>
      <Chip v-else :tone="deltaTone(row.ratingChange.delta)">{{
        row.ratingChange.delta === null
          ? row.ratingChange.rating
          : `${formatDelta(row.ratingChange.delta)} → ${row.ratingChange.rating}`
      }}</Chip>
    </td>
    <RankingCell
      v-for="cell in view.cells"
      :key="cell.problemId"
      :view="cell.view"
      :to="cell.to"
      :tick="isTicking"
    />
  </tr>
</template>
