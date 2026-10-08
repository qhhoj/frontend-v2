<script setup lang="ts">
import GlassCard from '@/components/GlassCard.vue';
import { RATING_TIERS, TIER_LOWER_BOUNDS, tierColor } from '@/lib/rating-tiers';
import type { RatingTier, TierColor } from '@/lib/rating-tiers';

/** Full class names, so Tailwind generates each swatch (a built name such as `bg-tier-${x}` would not be found). */
const SWATCH_CLASSES: Record<TierColor, string> = {
  none: 'bg-tier-none',
  newbie: 'bg-tier-newbie',
  pupil: 'bg-tier-pupil',
  specialist: 'bg-tier-specialist',
  expert: 'bg-tier-expert',
  'candidate-master': 'bg-tier-candidate-master',
  master: 'bg-tier-master',
  grandmaster: 'bg-tier-grandmaster',
};

interface LegendRow {
  tier: RatingTier;
  swatchClass: string;
  /** Lowest tier has an upper bound; every other tier a lower bound. */
  bound: { kind: 'atLeast' | 'below'; value: number };
}

const legendRow = (tier: RatingTier, index: number): LegendRow => ({
  tier,
  swatchClass: SWATCH_CLASSES[tierColor(tier)],
  bound:
    index === 0
      ? { kind: 'below', value: TIER_LOWER_BOUNDS[0] }
      : { kind: 'atLeast', value: TIER_LOWER_BOUNDS[index - 1]! },
});
/** Highest tier first. */
const rows = RATING_TIERS.map(legendRow).reverse();
</script>

<template>
  <GlassCard class="p-5">
    <h2 class="font-display text-lg font-semibold">{{ $t('leaderboard.legend') }}</h2>
    <ul class="mt-3 flex flex-col gap-2 text-sm">
      <li v-for="row in rows" :key="row.tier" class="flex items-center gap-2.5">
        <span aria-hidden="true" class="size-3 shrink-0 rounded-full" :class="row.swatchClass" />
        <span>
          {{
            $t(row.bound.kind === 'atLeast' ? 'leaderboard.tierAtLeast' : 'leaderboard.tierBelow', {
              tier: $t(`tiers.${row.tier}`),
              bound: row.bound.value,
            })
          }}
        </span>
      </li>
    </ul>
  </GlassCard>
</template>
