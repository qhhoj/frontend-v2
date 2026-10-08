<script setup lang="ts">
import type { RankingRow } from '@/api/types/contests';
import UserName from '@/components/UserName.vue';
import { formatNumber } from '@/lib/format';
import { formatCumtime, isPenaltyFormat, solvedCount } from '@/lib/ranking-cells';
import { useLocaleStore } from '@/stores/locale.store';

defineProps<{ rows: RankingRow[]; formatName: string }>();
const locale = useLocaleStore();
/** DOM order is rank order (screen readers); on wide screens first place sits in the middle, raised. */
const PLACES = ['md:order-2 md:-translate-y-2', 'md:order-1', 'md:order-3'] as const;
/** Coin tokens are contrast-checked against on-coin in themes.spec. */
const MEDALS = [
  'coin-3 size-15 text-[22px]',
  'coin-6 size-13 text-lg',
  'coin-5 size-13 text-lg',
] as const;
</script>

<template>
  <section :aria-label="$t('ranking.podium')" class="grid grid-cols-1 gap-4 md:grid-cols-3">
    <div
      v-for="(row, index) in rows"
      :key="row.participationId"
      class="glass flex items-center gap-3.5 rounded-card p-5"
      :class="PLACES[index]"
    >
      <span
        aria-hidden="true"
        class="flex shrink-0 items-center justify-center rounded-full font-display font-bold text-on-coin"
        :class="MEDALS[index]"
      >
        {{ row.rank }}
      </span>
      <div class="min-w-0">
        <span class="sr-only">{{ $t('ranking.columns.rank') }} {{ row.rank }}:</span>
        <UserName :username="row.user.username" class="text-lg" />
        <p class="font-mono text-[13px] text-muted">
          {{
            isPenaltyFormat(formatName)
              ? `${$t('ranking.solvedCount', { count: solvedCount(row) }, solvedCount(row))} · ${formatCumtime(formatName, row.cumtime)}`
              : formatNumber(row.score, locale.locale, 2)
          }}
        </p>
      </div>
    </div>
  </section>
</template>
