<script setup lang="ts">
import { Lock, TrendingUp } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestSummary } from '@/api/types/contests';
import { useContestTagsCache } from './contest-extras.queries';
import { catalogueBySlug, tagChipOf } from './tag-chips';

const props = defineProps<{
  contest: ContestSummary;
  withTags?: boolean;
  withCodeNeeded?: boolean;
}>();
const CHIP =
  'inline-flex min-h-6.5 items-center gap-1 rounded-pill border border-line px-2.5 text-[12.5px] font-medium whitespace-nowrap';
/** Read from the cache only: the list and the contest header fetch the catalogue; elsewhere tags stay neutral. */
const { data: catalogue } = useContestTagsCache();
const tagChips = computed(() => {
  const bySlug = catalogueBySlug(catalogue.value ?? []);
  return props.contest.tags.map((slug) => tagChipOf(slug, bySlug));
});
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
    <span
      v-for="chip in tagChips"
      :key="chip.slug"
      :data-tag-color="chip.color ?? 'neutral'"
      :class="[CHIP, chip.colorClass]"
      >{{ chip.label }}</span
    >
  </template>
</template>
