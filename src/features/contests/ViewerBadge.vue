<script setup lang="ts">
import type { ListCallToAction } from './contest-action';

defineProps<{ call: ListCallToAction }>();
const TONE =
  'inline-flex min-h-6.5 items-center rounded-pill bg-accent-soft px-2.5 text-[12.5px] font-semibold whitespace-nowrap text-accent-soft-text';
</script>

<template>
  <span v-if="call.badgeKey" data-testid="viewer-badge" :class="TONE">{{ $t(call.badgeKey) }}</span>
</template>
