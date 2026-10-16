<script setup lang="ts">
import { formatLabel } from '@/lib/contest-format';
import { Lock, TrendingUp } from 'lucide-vue-next';
import { computed } from 'vue';
import type { ContestSummary } from '@/api/types/contests';
import Chip from '@/components/ui/Chip.vue';
import ContestOrganizationChips from './ContestOrganizationChips.vue';
import { useContestTagsCache } from './contest-extras.queries';
import { catalogueBySlug, tagChipOf } from './tag-chips';

const props = defineProps<{
  contest: ContestSummary;
  withTags?: boolean;
  withCodeNeeded?: boolean;
  /** Leave the restricting-organization links out: the caller shows them elsewhere. */
  hideOrganizations?: boolean;
}>();
/** Read from the cache only: the list and the contest header fetch the catalogue; elsewhere tags stay neutral. */
const { data: catalogue } = useContestTagsCache();
const tagChips = computed(() => {
  const bySlug = catalogueBySlug(catalogue.value ?? []);
  return props.contest.tags.map((slug) => tagChipOf(slug, bySlug));
});
/** The restricting organizations lead the tags; the plain "organization only" chip stands in where they are not shown. */
const showOrganizations = computed(() => props.withTags && props.contest.organizations.length > 0);
</script>

<template>
  <Chip>{{ formatLabel(contest.formatName) }}</Chip>
  <Chip v-if="contest.isRated" tone="accent" :icon="TrendingUp">{{ $t('contests.rated') }}</Chip>
  <Chip v-if="withCodeNeeded && contest.requiresAccessCode" :icon="Lock">{{
    $t('contests.list.codeNeeded')
  }}</Chip>
  <Chip v-if="contest.isPrivate">{{ $t('contests.private') }}</Chip>
  <Chip v-else-if="contest.isOrganizationPrivate && !showOrganizations">{{
    $t('contests.organizationPrivate')
  }}</Chip>
  <template v-if="withTags">
    <ContestOrganizationChips v-if="showOrganizations && !hideOrganizations" :contest="contest" />
    <Chip
      v-for="chip in tagChips"
      :key="chip.slug"
      :data-tag-color="chip.color ?? 'neutral'"
      :tone="chip.color ?? 'neutral'"
      >{{ chip.label }}</Chip
    >
  </template>
</template>
