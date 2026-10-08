<script setup lang="ts">
import type { ContestListItem } from '@/api/types/contests';
import type { ListCallToAction } from './contest-action';

defineProps<{ contest: ContestListItem; call: ListCallToAction }>();
const BASE = 'inline-flex min-h-11 items-center rounded-pill font-semibold';
const PRIMARY = 'bg-gradient-accent px-5 text-on-accent';
const SECONDARY = 'border border-line px-4 hover:bg-surface-hover';
</script>

<template>
  <RouterLink
    :to="{ name: 'contest', params: { key: contest.key } }"
    :class="[BASE, call.isPrimary ? PRIMARY : SECONDARY]"
    >{{ $t(call.labelKey) }}<span class="sr-only">: {{ contest.name }}</span></RouterLink
  >
</template>
