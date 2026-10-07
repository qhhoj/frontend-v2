<script setup lang="ts">
import { computed } from 'vue';
import { coinIndex } from '@/lib/format';

const props = withDefaults(defineProps<{ seed: string; label?: string; size?: 'md' | 'sm' }>(), {
  label: '',
  size: 'md',
});
const COINS = ['coin-1', 'coin-2', 'coin-3', 'coin-4', 'coin-5', 'coin-6'] as const;
const coinClass = computed(() => COINS[coinIndex(props.seed)]);
</script>

<template>
  <span
    aria-hidden="true"
    class="inline-flex shrink-0 items-center justify-center rounded-full font-display font-bold text-on-coin"
    :class="[coinClass, size === 'md' ? 'size-10 text-[13px]' : 'size-7 text-[11px]']"
  >
    {{ label }}
  </span>
</template>
