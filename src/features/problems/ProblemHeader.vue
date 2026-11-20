<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import PageHeader from '@/components/ui/PageHeader.vue';
import type { PageCrumb } from '@/components/ui/PageHeader.vue';
import type { ContestDetail } from '@/api/types/contests';
import type { ProblemDetail } from '@/api/types/problems';
import { useContestProblem } from './use-contest-problem';

/**
 * The top of the problem page, on the page background: the eyebrow (inside the viewer's contest the contest's name and the
 * problem's label, "SQRT Cup 2025 / Bài B"; else the section, which `PageHeader` writes itself), the title, and the tabs in
 * the default slot. No facts: limits, points and the viewer's status are in the side panel (`ProblemLimits`). The `actions`
 * slot is for a tab without the panel. Keep `ProblemHeaderSkeleton.vue` in step.
 */
const props = defineProps<{ problem: ProblemDetail; contest?: ContestDetail | null }>();
const { t } = useI18n();
const { contestProblem } = useContestProblem(
  () => props.problem,
  () => props.contest,
);
const crumbs = computed<PageCrumb[]>(() => {
  const contest = props.contest;
  if (!contest || !contestProblem.value) return [];
  return [
    { label: contest.name, to: { name: 'contest', params: { key: contest.key } } },
    { label: t('problem.contestLabel', { label: contestProblem.value.label }) },
  ];
});
</script>

<template>
  <div data-testid="problem-header" class="contents">
    <PageHeader :title="problem.name" :crumbs="crumbs">
      <template v-if="$slots.actions" #actions><slot name="actions" /></template>
      <template v-if="$slots.default" #tabs><slot /></template>
    </PageHeader>
  </div>
</template>
