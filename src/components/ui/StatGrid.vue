<script setup lang="ts">
import { computed } from 'vue';

/** `tone` colours the value; the palette is kept small on purpose. */
export type StatTone = 'accent' | 'positive' | 'negative' | 'warning' | 'info';

export interface StatItem {
  label: string;
  value: string | number;
  tone?: StatTone;
  hint?: string;
}

const props = withDefaults(
  defineProps<{
    items: StatItem[];
    /** Columns from 640 px up; phones get at most two. Unset, tiles fit as many as the width allows. */
    cols?: 2 | 3 | 4;
    /** `fact`: plain label/value pairs. `stat`: big mono numbers in tinted tiles. */
    mode?: 'fact' | 'stat';
  }>(),
  { cols: undefined, mode: 'fact' },
);

const COLUMNS = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
} as const;
const AUTO_COLUMNS = 'grid-cols-[repeat(auto-fit,minmax(6.5rem,1fr))]';

const TONES: Record<StatTone, string> = {
  accent: 'text-accent-text',
  positive: 'text-positive',
  negative: 'text-negative',
  warning: 'text-warning',
  info: 'text-info',
};

const MODES = {
  fact: {
    item: 'min-w-0',
    value: 'mt-1 text-title leading-5.5 font-semibold',
  },
  stat: {
    item: 'min-w-0 rounded-row bg-surface-strong p-4',
    value: 'mt-1 font-mono text-stat leading-none font-semibold tabular-nums',
  },
} as const;

const gridClass = computed(() => (props.cols ? COLUMNS[props.cols] : AUTO_COLUMNS));
const look = computed(() => MODES[props.mode]);
</script>

<template>
  <dl class="m-0 grid gap-3" :class="gridClass">
    <div v-for="item in items" :key="item.label" :class="look.item">
      <dt class="text-meta leading-4.5 text-muted">{{ item.label }}</dt>
      <dd class="m-0" :class="[look.value, item.tone && TONES[item.tone]]">{{ item.value }}</dd>
      <dd v-if="item.hint" class="m-0 mt-1 text-meta leading-4.5 text-muted">{{ item.hint }}</dd>
    </div>
  </dl>
</template>
