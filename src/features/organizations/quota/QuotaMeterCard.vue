<script setup lang="ts">
import { computed } from 'vue';
import type { QuotaMeter } from '@/api/types/organization-usage';
import GlassCard from '@/components/GlassCard.vue';
import { meterPercent } from '@/lib/quota';

/** One meter of board M7A: the numbers, the percentage and a bar; colour follows the state but the numbers say it all. */
const props = defineProps<{
  label: string;
  meter: QuotaMeter;
  valueText: string;
  detail: string;
  /** Promotion: the bar and percentage are hidden, the numbers stay. */
  unlimited?: boolean;
}>();
const FILL = { normal: 'bg-accent', near: 'bg-caution-strong', over: 'bg-negative' } as const;
const percent = computed(() => meterPercent(props.meter));
const state = computed(() => {
  if (props.meter.isOver) return 'over';
  return props.meter.isNearLimit ? 'near' : 'normal';
});
</script>

<template>
  <GlassCard as="div" data-testid="quota-meter" class="flex flex-col gap-2 rounded-panel p-5">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <h2 class="font-display text-base font-bold">{{ label }}</h2>
      <p class="font-semibold tabular-nums">{{ valueText }}</p>
    </div>
    <div
      v-if="!unlimited"
      role="progressbar"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="percent.barPercent"
      :aria-label="$t('orgQuota.meterLabel', { label, percent: percent.percent })"
      class="h-3 overflow-hidden rounded-pill bg-surface-hover"
    >
      <div
        class="h-full rounded-pill"
        :class="FILL[state]"
        :style="{ width: `${percent.barPercent}%` }"
      />
    </div>
    <div class="flex flex-wrap justify-between gap-2 text-sm text-muted">
      <span>{{ detail }}</span
      ><span v-if="!unlimited" class="tabular-nums">{{ percent.percent }}%</span>
    </div>
  </GlassCard>
</template>
