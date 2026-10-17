<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import type { RankingProblem, RankingRow } from '@/api/types/contests';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { formatCumtime, isPenaltyFormat, solvedCount } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';

/**
 * One card split into a cell per podium rank (P-24 B). From lg up the cells sit side by side between hairlines, a tied
 * rank stacking its names in one cell; below lg every person is a 46 px row of one list. DOM order is rank order in
 * both layouts, and names wrap instead of being cut.
 */
const props = defineProps<{
  rows: RankingRow[];
  problems: RankingProblem[];
  context: RankingContext;
}>();
/** Coin tokens are contrast-checked against on-coin in themes.node.spec; tied rows share a coin. */
const COINS: Record<number, string> = { 1: 'coin-3', 2: 'coin-6', 3: 'coin-5' };
const COIN =
  'flex size-7 shrink-0 items-center justify-center rounded-full text-caption font-bold text-on-coin';
const coinOf = (rank: number) => `${COIN} ${COINS[rank] ?? COINS[3]}`;
/** Static classes, so Tailwind sees each one: a board with a tie at 1 has fewer than three ranks. */
const COLUMNS: Record<number, string> = { 1: '', 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3' };
const groups = computed(() => {
  const byRank: Array<{ rank: number; rows: RankingRow[] }> = [];
  for (const row of props.rows) {
    const rank = row.rank ?? 0;
    const last = byRank.at(-1);
    if (last?.rank === rank) last.rows.push(row);
    else byRank.push({ rank, rows: [row] });
  }
  return byRank;
});
const scoreOf = (row: RankingRow) => {
  if (!isPenaltyFormat(props.context.formatName))
    return formatNumber(row.score, props.context.locale, props.context.pointsPrecision);
  const solved = solvedCount(row, props.problems, props.context);
  return `${translate('ranking.solvedCount', { count: solved }, solved)} · ${formatCumtime(props.context.formatName, row.cumtime)}`;
};
</script>

<template>
  <section :aria-label="$t('ranking.podium')">
    <Card
      as="ol"
      class="grid divide-y divide-line overflow-hidden lg:divide-x lg:divide-y-0"
      :class="COLUMNS[groups.length]"
    >
      <li
        v-for="group in groups"
        :key="group.rank"
        data-podium-rank
        class="lg:flex lg:items-center lg:gap-3.5 lg:px-5 lg:py-4"
      >
        <span aria-hidden="true" class="hidden lg:flex" :class="coinOf(group.rank)">{{
          group.rank
        }}</span>
        <div class="min-w-0 flex-1">
          <ul class="divide-y divide-line lg:flex lg:flex-col lg:gap-1.5 lg:divide-y-0">
            <li
              v-for="row in group.rows"
              :key="row.participationId"
              class="flex min-h-11.5 items-center gap-3 px-4 py-2 lg:min-h-0 lg:p-0"
            >
              <span aria-hidden="true" class="lg:hidden" :class="coinOf(group.rank)">{{
                group.rank
              }}</span>
              <span class="sr-only">{{ $t('ranking.columns.rank') }} {{ group.rank }}:</span>
              <UserAvatar :username="row.user.username" :size="20" />
              <UserName
                :username="row.user.username"
                :rating="row.user.rating"
                class="min-w-0 font-semibold [overflow-wrap:anywhere]"
              />
              <span
                v-if="group.rows.length > 1"
                class="ml-auto shrink-0 text-meta text-muted lg:hidden"
                >{{ $t('ranking.tied') }}</span
              >
              <span
                class="shrink-0 font-mono text-sm whitespace-nowrap tabular-nums lg:text-muted"
                :class="group.rows.length > 1 ? 'lg:ml-auto' : 'ml-auto'"
                >{{ scoreOf(row) }}</span
              >
            </li>
          </ul>
          <p v-if="group.rows.length > 1" class="mt-1 hidden text-caption text-muted lg:block">
            {{ $t('ranking.tiedAt', { rank: group.rank }) }}
          </p>
        </div>
      </li>
    </Card>
  </section>
</template>
