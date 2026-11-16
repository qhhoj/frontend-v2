<script setup lang="ts">
import type { Language } from '@/api/types/problems';
import type { SubmissionResult } from '@/api/types/submissions';
import AppButton from '@/components/ui/AppButton.vue';
import Card from '@/components/ui/Card.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import FormField from '@/components/ui/FormField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { translate } from '@/i18n';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { MAX_PROBLEM_CODE_LENGTH, MAX_USERNAME_LENGTH } from '../use-submission-filters';
import type { StatusGroup, SubmissionFilters } from '../use-submission-filters';
import LanguageFilterSelect from '../LanguageFilterSelect.vue';
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
  /** The language choice, shown here only on a phone (the chip row holds it from sm). */
  languages: Language[];
}>();
const emit = defineEmits<{ update: [patch: Partial<SubmissionFilters>]; reset: [] }>();

/** The mock-up's six; a URL may carry any other valid result, the table's empty state then names it. */
const RESULT_CHOICES: readonly SubmissionResult[] = ['AC', 'WA', 'TLE', 'MLE', 'RTE', 'CE'];
const STATUS_GROUPS: readonly StatusGroup[] = ['grading', 'final'];

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
const resultLabel = (code: SubmissionResult) => `${code} ${translate(`verdicts.${code}`)}`;
</script>

<template>
  <Card
    as="section"
    :aria-label="$t('submissions.quick.advanced')"
    class="grid gap-x-6 gap-y-4 p-5 md:grid-cols-[minmax(0,1fr)_minmax(0,18rem)]"
  >
    <div class="flex items-center justify-between md:col-span-2">
      <h2 class="text-title leading-5.5 font-semibold">{{ $t('submissions.quick.advanced') }}</h2>
      <AppButton tone="link" data-testid="filters-reset" @click="emit('reset')">
        {{ $t('submissions.rail.reset') }}
      </AppButton>
    </div>
    <div class="flex min-w-0 flex-col gap-4" :class="{ 'md:row-span-2': showUser }">
      <fieldset class="m-0 min-w-0 border-0 p-0">
        <legend class="mb-1 text-sm text-muted">{{ $t('submissions.rail.results') }}</legend>
        <div class="grid grid-cols-2 gap-x-3 sm:grid-cols-3">
          <Checkbox
            v-for="code in RESULT_CHOICES"
            :key="code"
            :model-value="filters.results.includes(code)"
            :label="resultLabel(code)"
            :value="code"
            @update:model-value="
              emit('update', { results: toggled(filters.results, code, $event) })
            "
          />
        </div>
      </fieldset>
      <fieldset v-if="showStatusGroups" class="m-0 min-w-0 border-0 p-0">
        <legend class="mb-1 text-sm text-muted">
          {{ $t('contests.submissions.statusTitle') }}
        </legend>
        <div class="grid gap-x-3 sm:grid-cols-2">
          <Checkbox
            v-for="group in STATUS_GROUPS"
            :key="group"
            :model-value="filters.statusGroups.includes(group)"
            :label="$t(`contests.submissions.status.${group}`)"
            :value="group"
            @update:model-value="
              emit('update', { statusGroups: toggled(filters.statusGroups, group, $event) })
            "
          />
        </div>
      </fieldset>
    </div>
    <LanguageFilterSelect
      class="w-fit sm:hidden"
      :filters="filters"
      :languages="languages"
      @update="emit('update', $event)"
    />
    <FormField v-if="problemSource.kind === 'code'" :label="$t('submissions.rail.problemLabel')">
      <TextInput
        v-model="problemText"
        name="problem"
        :maxlength="MAX_PROBLEM_CODE_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.problem')"
      />
    </FormField>
    <SubmissionProblemPicker
      v-else
      :source="problemSource"
      :code="filters.problem"
      @pick="emit('update', { problem: $event })"
    />
    <FormField v-if="showUser" :label="$t('submissions.rail.userLabel')">
      <TextInput
        v-model="userText"
        name="user"
        :maxlength="MAX_USERNAME_LENGTH"
        autocomplete="off"
        :placeholder="$t('submissions.rail.user')"
      />
    </FormField>
  </Card>
</template>
