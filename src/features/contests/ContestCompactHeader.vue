<script setup lang="ts">
import PageHeader from '@/components/ui/PageHeader.vue';
import type { ContestSummary } from '@/api/types/contests';
import PhasePill from './PhasePill.vue';

defineProps<{ contest: ContestSummary }>();
</script>

<template>
  <PageHeader
    :title="contest.name"
    :crumbs="[
      { label: $t('contests.title'), to: { name: 'contests' } },
      { label: contest.key, mono: true },
    ]"
  >
    <template #above><PhasePill :phase="contest.phase" /></template>
  </PageHeader>
</template>
