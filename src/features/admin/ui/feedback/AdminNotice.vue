<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

export type NoticeTone = 'info' | 'caution' | 'danger';

/**
 * A thin wrapper kept for old call sites (use `Notice compact` in new code): a compact `Notice` with a title and a one-line
 * summary. A long explanation goes in the default slot, behind "Chi tiết". No Bit; no role for standing advice (it is not
 * news), while a danger notice is an alert like every failure. `caution` is the old name of `warning`.
 */
withDefaults(defineProps<{ tone?: NoticeTone; title: string; summary?: string }>(), {
  tone: 'info',
  summary: undefined,
});

const TONES = { info: 'info', caution: 'warning', danger: 'danger' } as const;
</script>

<template>
  <Notice compact :role="null" :tone="TONES[tone]" :title="title">
    <template v-if="summary" #default>{{ summary }}</template>
    <template v-if="$slots.default" #details><slot /></template>
    <template #action><slot name="action" /></template>
  </Notice>
</template>
