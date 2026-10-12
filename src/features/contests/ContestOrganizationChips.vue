<script setup lang="ts">
import { Building2 } from 'lucide-vue-next';
import type { ContestSummary } from '@/api/types/contests';

defineProps<{ contest: ContestSummary }>();
</script>

<template>
  <RouterLink
    v-for="organization in contest.organizations"
    :key="organization.slug"
    :to="{ name: 'organization', params: { slug: organization.slug } }"
    :title="organization.name"
    data-testid="contest-organization-chip"
    class="inline-flex min-h-6.5 max-w-full items-center gap-1 rounded-pill border border-line bg-surface-strong px-2.5 text-caption font-medium whitespace-nowrap text-content hover:border-accent hover:text-accent-text"
    ><Building2 class="size-3 shrink-0" aria-hidden="true" /><span class="truncate">{{
      organization.name
    }}</span></RouterLink
  >
</template>
