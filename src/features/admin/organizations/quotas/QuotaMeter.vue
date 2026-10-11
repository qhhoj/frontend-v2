<script setup lang="ts">
import { computed } from 'vue';
import { meterPercent } from '@/lib/quota';

/** Above this share a meter turns caution (pages/admin.md, "Quotas"); at 100 % and over it turns negative. */
const CAUTION_PERCENT = 80;
const FULL_PERCENT = 100;

/**
 * One quota meter in a table cell: "164 / 200 · 82 %" over a thin bar. The text carries the state; the bar's colour only
 * repeats it. An unlimited organization shows "164 / Không giới hạn" and no bar.
 */
const props = defineProps<{
  used: number;
  limit: number;
  unlimited: boolean;
  /** The meter's accessible name ("Tín dụng tháng của THPT …"). */
  label: string;
  format: (value: number) => string;
}>();
const share = computed(() => meterPercent({ used: props.used, limit: props.limit }));
const tone = computed(() => {
  if (share.value.percent >= FULL_PERCENT) return { bar: 'bg-negative', text: 'text-negative' };
  if (share.value.percent > CAUTION_PERCENT)
    return { bar: 'bg-verdict-tle', text: 'text-verdict-tle' };
  return { bar: 'bg-accent', text: 'text-muted' };
});
</script>

<template>
  <span class="flex min-w-36 flex-col gap-1">
    <span class="font-mono text-sm whitespace-nowrap tabular-nums">
      {{ format(used) }} /
      <template v-if="unlimited">
        <span data-testid="quota-unlimited-label">{{ $t('admin.quota.unlimited') }}</span>
      </template>
      <template v-else>
        {{ format(limit) }}
        <span class="font-semibold" :class="tone.text"
          >· {{ $t('admin.quota.percent', { percent: share.percent }) }}</span
        >
      </template>
    </span>
    <span
      v-if="!unlimited"
      role="meter"
      :aria-label="label"
      aria-valuemin="0"
      :aria-valuemax="limit"
      :aria-valuenow="Math.min(used, limit)"
      :aria-valuetext="$t('admin.quota.percent', { percent: share.percent })"
      class="block h-1.5 w-full overflow-hidden rounded-pill bg-surface-strong"
    >
      <span
        class="block h-full rounded-pill"
        :class="tone.bar"
        :style="{ width: `${share.barPercent}%` }"
      />
    </span>
  </span>
</template>
