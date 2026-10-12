<script setup lang="ts">
import type { SubmissionResult } from '@/api/types/submissions';
import GlassCard from '@/components/GlassCard.vue';
import { TOOLBAR_INPUT_CLASS } from '@/components/toolbar-classes';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { MAX_PROBLEM_CODE_LENGTH, MAX_USERNAME_LENGTH } from '../use-submission-filters';
import type { StatusGroup, SubmissionFilters } from '../use-submission-filters';
import SubmissionProblemPicker from './SubmissionProblemPicker.vue';
import type { ProblemPickerSource } from './problem-picker-options';

/**
 * "Bộ lọc nâng cao": the filters the chips above the list do not set. The problem box is a typed code for the whole
 * site and a picker of the scope's problems otherwise; `showUser` is off when the scope pins the user.
 */
const props = defineProps<{
  filters: SubmissionFilters;
  problemSource: ProblemPickerSource;
  showUser: boolean;
  showStatusGroups: boolean;
}>();
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>]; reset: [] }>();

/** The mock-up's six; a URL may carry any other valid result, the table's empty state then names it. */
const RESULT_CHOICES: readonly SubmissionResult[] = ['AC', 'WA', 'TLE', 'MLE', 'RTE', 'CE'];
const STATUS_GROUPS: readonly StatusGroup[] = ['grading', 'final'];
const TEXT_INPUT_CLASSES = `${TOOLBAR_INPUT_CLASS} w-full`;

const problemText = useDebouncedText(
  () => props.filters.problem,
  (problem) => emit('update', { problem }),
);
const userText = useDebouncedText(
  () => props.filters.user,
  (user) => emit('update', { user }),
);

/** The list with `value` ticked or unticked. */
const toggled = <T,>(list: readonly T[], value: T, isChecked: boolean) =>
  isChecked ? [...list, value] : list.filter((selected) => selected !== value);
const checkedOf = (event: Event) => (event.target as HTMLInputElement).checked;
</script>

<template>
  <GlassCard
    as="section"
    :aria-label="$t('submissions.quick.advanced')"
    class="grid gap-x-6 gap-y-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]"
  >
    <div class="flex items-center justify-between md:col-span-2">
      <h2 class="font-display text-base font-bold">{{ $t('submissions.quick.advanced') }}</h2>
      <button
        type="button"
        data-testid="filters-reset"
        class="min-h-11 rounded-row px-3 font-semibold text-accent-text hover:bg-surface-hover"
        @click="emit('reset')"
      >
        {{ $t('submissions.rail.reset') }}
      </button>
    </div>
    <div class="flex min-w-0 flex-col gap-4" :class="{ 'md:row-span-2': showUser }">
      <fieldset class="m-0 min-w-0 border-0 p-0">
        <legend class="mb-1 text-sm text-muted">{{ $t('submissions.rail.results') }}</legend>
        <div class="grid grid-cols-2 gap-x-3 sm:grid-cols-3">
          <label
            v-for="code in RESULT_CHOICES"
            :key="code"
            class="flex min-h-11 cursor-pointer items-center gap-2"
          >
            <input
              type="checkbox"
              :value="code"
              :checked="filters.results.includes(code)"
              class="size-4 accent-accent"
              @change="
                emit('update', { results: toggled(filters.results, code, checkedOf($event)) })
              "
            />
            <span class="w-9 font-mono text-sm font-bold">{{ code }}</span>
            <span class="text-sm">{{ $t(`verdicts.${code}`) }}</span>
          </label>
        </div>
      </fieldset>
      <fieldset v-if="showStatusGroups" class="m-0 min-w-0 border-0 p-0">
        <legend class="mb-1 text-sm text-muted">
          {{ $t('contests.submissions.statusTitle') }}
        </legend>
        <div class="grid gap-x-3 sm:grid-cols-2">
          <label
            v-for="group in STATUS_GROUPS"
            :key="group"
            class="flex min-h-11 cursor-pointer items-center gap-2.5"
          >
            <input
              type="checkbox"
              class="size-4 accent-accent"
              :value="group"
              :checked="filters.statusGroups.includes(group)"
              @change="
                emit('update', {
                  statusGroups: toggled(filters.statusGroups, group, checkedOf($event)),
                })
              "
            />
            <span class="text-sm">{{ $t(`contests.submissions.status.${group}`) }}</span>
          </label>
        </div>
      </fieldset>
    </div>
    <label v-if="problemSource.kind === 'code'" class="flex flex-col gap-1 text-sm text-muted">
      {{ $t('submissions.rail.problemLabel') }}
      <input
        v-model="problemText"
        name="problem"
        type="text"
        :maxlength="MAX_PROBLEM_CODE_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.problem')"
        :class="TEXT_INPUT_CLASSES"
      />
    </label>
    <SubmissionProblemPicker
      v-else
      :source="problemSource"
      :code="filters.problem"
      @pick="emit('update', { problem: $event })"
    />
    <label v-if="showUser" class="flex flex-col gap-1 text-sm text-muted">
      {{ $t('submissions.rail.userLabel') }}
      <input
        v-model="userText"
        name="user"
        type="text"
        :maxlength="MAX_USERNAME_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.user')"
        :class="TEXT_INPUT_CLASSES"
      />
    </label>
  </GlassCard>
</template>
