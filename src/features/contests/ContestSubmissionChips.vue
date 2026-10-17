<script setup lang="ts">
import type { ContestProblem } from '@/api/types/contests';
import AdvancedFiltersButton from '@/features/submissions/AdvancedFiltersButton.vue';
import FilterToggle from '@/features/problems/FilterToggle.vue';
import type { SubmissionFilters } from '@/features/submissions/use-submission-filters';
import { contestChipPatch, isContestChipOn } from './contest-submission-chips';
import type { ContestChip } from './contest-submission-chips';

/**
 * The contest tab's filters (P-21): "Tất cả", one chip per problem letter, "Đang chấm". The advanced panel stays
 * only where the list holds everyone's submissions (`advanced` set), for the user and result filters.
 */
const props = defineProps<{
  filters: SubmissionFilters;
  problems: readonly Pick<ContestProblem, 'code' | 'label' | 'name'>[];
  advanced: { open: boolean; count: number; panelId: string } | null;
}>();
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>]; toggleAdvanced: [] }>();
const ALL: ContestChip = { kind: 'all' };
const GRADING: ContestChip = { kind: 'grading' };
const pick = (chip: ContestChip) => emit('update', contestChipPatch(props.filters, chip));
</script>

<template>
  <div
    role="search"
    :aria-label="$t('submissions.rail.title')"
    class="flex flex-wrap items-center gap-2"
  >
    <FilterToggle :pressed="isContestChipOn(filters, ALL)" @toggle="pick(ALL)">
      {{ $t('contests.submissions.all') }}
    </FilterToggle>
    <FilterToggle
      v-for="problem in problems"
      :key="problem.code"
      :pressed="isContestChipOn(filters, { kind: 'problem', code: problem.code })"
      :title="problem.name"
      :aria-label="`${problem.label}. ${problem.name}`"
      class="min-w-11 justify-center font-display"
      @toggle="pick({ kind: 'problem', code: problem.code })"
    >
      {{ problem.label }}
    </FilterToggle>
    <FilterToggle :pressed="isContestChipOn(filters, GRADING)" @toggle="pick(GRADING)">
      {{ $t('submissions.quick.grading') }}
    </FilterToggle>
    <AdvancedFiltersButton
      v-if="advanced"
      :open="advanced.open"
      :count="advanced.count"
      :panel-id="advanced.panelId"
      @toggle="emit('toggleAdvanced')"
    />
  </div>
</template>
