<script setup lang="ts">
import { computed } from 'vue';
import { deltaToneClass, formatDelta } from '@/lib/rating-delta';
import { ratingTier, tierColor } from '@/lib/rating-tiers';
import { TIER_TEXT_CLASSES } from '@/lib/tier-classes';

/** The four figures above the rating chart: current (in its tier colour), highest, contests counted, and the latest change. */
const props = defineProps<{ current: number; max: number; count: number; delta: number | null }>();
const currentClass = computed(() => TIER_TEXT_CLASSES[tierColor(ratingTier(props.current))]);
const deltaText = computed(() => (props.delta === null ? '—' : formatDelta(props.delta)));
const deltaClass = computed(() => deltaToneClass(props.delta));
</script>

<template>
  <dl class="grid grid-cols-2 gap-2 sm:grid-cols-4" data-testid="rating-stats">
    <div class="rounded-row bg-surface-strong px-2.5 py-2">
      <dt class="text-xs text-muted">{{ $t('ratingChart.current') }}</dt>
      <dd
        class="font-display text-section leading-7 font-semibold tabular-nums"
        :class="currentClass"
      >
        {{ current }}
      </dd>
    </div>
    <div class="rounded-row bg-surface-strong px-2.5 py-2">
      <dt class="text-xs text-muted">{{ $t('ratingChart.max') }}</dt>
      <dd class="font-display text-section leading-7 font-semibold tabular-nums">{{ max }}</dd>
    </div>
    <div class="rounded-row bg-surface-strong px-2.5 py-2">
      <dt class="text-xs text-muted">{{ $t('ratingChart.contests') }}</dt>
      <dd class="font-display text-section leading-7 font-semibold tabular-nums">{{ count }}</dd>
    </div>
    <div class="rounded-row bg-surface-strong px-2.5 py-2">
      <dt class="text-xs text-muted">{{ $t('ratingChart.delta') }}</dt>
      <dd
        class="font-display text-section leading-7 font-semibold tabular-nums"
        :class="deltaClass"
      >
        {{ deltaText }}
      </dd>
    </div>
  </dl>
</template>
