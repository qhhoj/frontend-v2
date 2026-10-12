<script setup lang="ts">
import Notice from '@/components/ui/Notice.vue';

export type NoticeTone = 'info' | 'caution' | 'danger';

/**
 * A short standing admin notice: a compact `Notice` with a title and a one-line summary. A long explanation goes in the
 * default slot, behind "Chi tiết". No Bit, no role (it is not news).
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
