<script setup lang="ts">
import { computed } from 'vue';

/**
 * A share from 0 to 100 as one short neutral bar: it carries no verdict or status colour, because it measures the
 * problem, not the viewer. Decorative: the number beside it says the value.
 */
const props = defineProps<{ percent: number }>();
const width = computed(() => `${Math.min(Math.max(props.percent, 0), 100)}%`);
</script>

<template>
  <span aria-hidden="true" class="inline-block h-1 w-14 overflow-hidden rounded-cell bg-line">
    <span class="block h-full bg-muted" :style="{ width }" />
  </span>
</template>
