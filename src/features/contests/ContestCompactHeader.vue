<script setup lang="ts">
import type { ContestSummary } from '@/api/types/contests';
import PhasePill from './PhasePill.vue';

defineProps<{ contest: ContestSummary }>();
</script>

<template>
  <header class="flex flex-col gap-2">
    <nav :aria-label="$t('common.breadcrumb')" class="text-sm text-muted">
      <RouterLink :to="{ name: 'contests' }" class="hover:text-content">{{
        $t('contests.title')
      }}</RouterLink>
      <span aria-hidden="true"> / </span>
      <span class="font-mono">{{ contest.key }}</span>
    </nav>
    <div class="flex flex-wrap items-center gap-3">
      <PhasePill :phase="contest.phase" />
      <h1 class="font-display text-3xl font-bold tracking-tight sm:text-4xl">{{ contest.name }}</h1>
    </div>
  </header>
</template>
