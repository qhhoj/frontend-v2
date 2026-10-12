<script setup lang="ts">
import Card from '@/components/ui/Card.vue';
import { computed } from 'vue';
import type { RankingProblem, RankingRow } from '@/api/types/contests';
import BitLoop from '@/components/BitLoop.vue';
import UserName from '@/components/UserName.vue';
import UserAvatar from '@/mascot/avatar/UserAvatar.vue';
import { formatNumber } from '@/lib/format';
import { formatCumtime, isPenaltyFormat, solvedCount } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';

const props = defineProps<{
  rows: RankingRow[];
  problems: RankingProblem[];
  context: RankingContext;
}>();
const solved = (row: RankingRow) => solvedCount(row, props.problems, props.context);
/** Medal and size follow the rank, so tied rows share a medal. */
const MEDALS: Record<number, string> = {
  1: 'coin-3 size-15 text-[22px]',
  2: 'coin-6 size-13 text-lg',
  3: 'coin-5 size-13 text-lg',
};
/** Coin tokens are contrast-checked against on-coin in themes.node.spec. */
const medalOf = (row: RankingRow) => MEDALS[row.rank ?? 3];
/**
 * DOM order is rank order (screen readers). Only the plain 1-2-3 podium is rearranged on wide screens
 * (first place in the middle, raised) from lg up; below it three cards in a row leave the name no room; ties keep rank order.
 */
const isPlainPodium = computed(() => props.rows.map((row) => row.rank).join() === '1,2,3');
const PLACES: Record<number, string> = {
  1: 'lg:order-2 lg:-translate-y-2',
  2: 'lg:order-1',
  3: 'lg:order-3',
};
const placeOf = (row: RankingRow) => (isPlainPodium.value ? PLACES[row.rank ?? 3] : '');
</script>

<template>
  <section :aria-label="$t('ranking.podium')" class="grid grid-cols-1 gap-4 lg:grid-cols-3">
    <Card
      v-for="row in rows"
      :key="row.participationId"
      as="div"
      class="flex items-center gap-3.5 p-5"
      :class="placeOf(row)"
    >
      <span
        aria-hidden="true"
        class="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-on-coin"
        :class="medalOf(row)"
      >
        {{ row.rank }}
      </span>
      <UserAvatar :username="row.user.username" :size="24" />
      <div class="min-w-0 flex-1">
        <span class="sr-only">{{ $t('ranking.columns.rank') }} {{ row.rank }}:</span>
        <UserName
          :username="row.user.username"
          :rating="row.user.rating"
          :title="row.user.username"
          class="block truncate text-lg"
        />
        <p class="truncate font-mono text-meta text-muted">
          {{
            isPenaltyFormat(context.formatName)
              ? `${$t('ranking.solvedCount', { count: solved(row) }, solved(row))} · ${formatCumtime(context.formatName, row.cumtime)}`
              : formatNumber(row.score, context.locale, context.pointsPrecision)
          }}
        </p>
      </div>
      <!-- Decorative: the rank and name say who won. Only the first place gets the approved rankUp loop. -->
      <BitLoop
        v-if="row.rank === 1"
        data-testid="podium-bit"
        kind="rankUp"
        class="shrink-0 [--bit-px:3px]"
      />
    </Card>
  </section>
</template>
