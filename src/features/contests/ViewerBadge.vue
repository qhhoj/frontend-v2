<script setup lang="ts">
import type { ListCallToAction } from './contest-action';
import { IN_CONTEST_BADGE } from './contest-action';

defineProps<{ call: ListCallToAction }>();
const BASE =
  'inline-flex min-h-6.5 items-center rounded-pill px-2.5 text-[12.5px] font-semibold whitespace-nowrap';
const IN_CONTEST_TONE = 'bg-verdict-ac-bg text-verdict-ac';
const OTHER_TONE = 'bg-accent-soft text-accent-soft-text';
</script>

<template>
  <span
    v-if="call.badgeKey"
    :class="[BASE, call.badgeKey === IN_CONTEST_BADGE ? IN_CONTEST_TONE : OTHER_TONE]"
    >{{ $t(call.badgeKey) }}</span
  >
</template>
