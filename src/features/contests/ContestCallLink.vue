<script setup lang="ts">
import type { ContestListItem } from '@/api/types/contests';
import type { ListCallToAction } from './contest-action';

defineProps<{ contest: ContestListItem; call: ListCallToAction }>();
const BASE = 'inline-flex min-h-11 items-center rounded-pill px-5 font-semibold';
const PRIMARY = 'bg-gradient-accent text-on-accent';
const SECONDARY = 'border border-line hover:bg-surface-hover';
</script>

<template>
  <RouterLink
    :to="{ name: 'contest', params: { key: contest.key } }"
    :class="[BASE, call.isPrimary ? PRIMARY : SECONDARY]"
    >{{ $t(call.labelKey) }}<span class="sr-only">: {{ contest.name }}</span></RouterLink
  >
</template>
