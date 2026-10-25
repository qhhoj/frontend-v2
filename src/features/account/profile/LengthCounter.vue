<script setup lang="ts">
import { computed } from 'vue';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';

/** "13 / 30"; over the limit it turns the negative colour, and the field's error text says it in words. */
const props = defineProps<{ used: number; max: number }>();
const locale = useLocaleStore();
const over = computed(() => props.used > props.max);
</script>

<template>
  <span
    class="font-mono text-caption leading-4 tabular-nums"
    :class="over ? 'font-semibold text-negative' : 'text-muted'"
  >
    {{ formatNumber(used, locale.locale) }} / {{ formatNumber(max, locale.locale) }}
  </span>
</template>
