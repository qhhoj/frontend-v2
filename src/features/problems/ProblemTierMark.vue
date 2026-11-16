<script setup lang="ts">
import { computed } from 'vue';
import { tierOf } from './problem-tier';

/** The difficulty square before a problem's points: its colour, and the tier's name as a tooltip and for screen readers. */
const props = defineProps<{ points: number }>();
const TIER_CLASS = { 1: 'bg-diff-1', 2: 'bg-diff-2', 3: 'bg-diff-3', 4: 'bg-diff-4' } as const;
const tier = computed(() => tierOf(props.points));
const nameKey = computed(() => `problems.tier.${tier.value}`);
</script>

<template>
  <span class="inline-flex" :title="$t(nameKey)">
    <span
      aria-hidden="true"
      data-testid="tier-mark"
      :data-tier="tier"
      class="size-[9px] rounded-[3px]"
      :class="TIER_CLASS[tier]"
    />
    <span class="sr-only">{{ $t(nameKey) }}</span>
  </span>
</template>
