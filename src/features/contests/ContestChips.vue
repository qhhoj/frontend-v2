<script setup lang="ts">
import { Lock, TrendingUp } from 'lucide-vue-next';
import type { ContestSummary } from '@/api/types/contests';

defineProps<{ contest: ContestSummary; withTags?: boolean; withCodeNeeded?: boolean }>();
const CHIP =
  'inline-flex min-h-6.5 items-center gap-1 rounded-pill border border-line px-2.5 text-[12.5px] font-medium whitespace-nowrap';
</script>

<template>
  <span :class="[CHIP, 'bg-surface-strong font-semibold text-content']">{{
    $t(`formats.${contest.formatName}`)
  }}</span>
  <span
    v-if="contest.isRated"
    :class="[CHIP, 'border-transparent bg-accent-soft text-accent-soft-text']"
  >
    <TrendingUp class="size-3" aria-hidden="true" />{{ $t('contests.rated') }}
  </span>
  <span v-if="withCodeNeeded && contest.requiresAccessCode" :class="[CHIP, 'text-muted']"
    ><Lock class="size-3" aria-hidden="true" />{{ $t('contests.list.codeNeeded') }}</span
  >
  <span v-if="contest.isPrivate" :class="[CHIP, 'text-muted']">{{ $t('contests.private') }}</span>
  <span v-else-if="contest.isOrganizationPrivate" :class="[CHIP, 'text-muted']">{{
    $t('contests.organizationPrivate')
  }}</span>
  <template v-if="withTags">
    <span v-for="tag in contest.tags" :key="tag" :class="[CHIP, 'text-muted']">{{ tag }}</span>
  </template>
</template>
