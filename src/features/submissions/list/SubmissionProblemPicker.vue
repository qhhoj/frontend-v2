<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, ref, useId } from 'vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useLocaleStore } from '@/stores/locale.store';
import { useOrgProblemsQuery } from '@/features/organizations/problems/org-problems.queries';
import { pickerOptions } from './problem-picker-options';
import type { ProblemPickerSource } from './problem-picker-options';

/**
 * The filter's problem box for a list scoped to a set of problems: a contest's (searched here) or an organization's
 * (archived ones too, searched on the server as the viewer types). `code` is '' for every problem.
 */
const props = defineProps<{ source: ProblemPickerSource; code: string }>();
const emit = defineEmits<{ pick: [code: string] }>();
const locale = useLocaleStore();
/** Select shows its placeholder for null, not for ''. */
const ANY_PROBLEM = null;
const labelId = useId();

const search = ref('');
const typed = useDebouncedText(
  () => search.value,
  (text) => (search.value = text),
);
const orgSlug = computed(() => (props.source.kind === 'organization' ? props.source.slug : ''));
const orgFilters = computed(() => ({
  tag: null,
  archived: 'all' as const,
  q: search.value,
  page: 1,
}));
const orgProblems = useOrgProblemsQuery(orgSlug, orgFilters, () => orgSlug.value !== '');

/** The problems the box offers now: the contest's all of them, the organization's the server's answer to the search. */
const listed = computed(() =>
  props.source.kind === 'contest'
    ? props.source.problems.map((problem) => ({
        code: problem.code,
        label: `${problem.label} · ${problem.name}`,
      }))
    : (orgProblems.data.value?.items ?? []).map((problem) => ({
        code: problem.code,
        label: `${problem.code} · ${problem.name}`,
      })),
);
const total = computed(() =>
  props.source.kind === 'contest'
    ? props.source.problems.length
    : (orgProblems.data.value?.meta.total ?? undefined),
);
const anyLabel = computed(() =>
  total.value !== undefined && !search.value
    ? translate('submissions.rail.anyProblemCount', {
        count: formatNumber(total.value, locale.locale),
      })
    : translate('submissions.rail.anyProblem'),
);
const options = computed(() =>
  pickerOptions({ listed: listed.value, picked: props.code, anyLabel: anyLabel.value }),
);
const labelKey = computed(() =>
  props.source.kind === 'organization'
    ? 'submissions.rail.orgProblemLabel'
    : 'submissions.rail.problemLabel',
);
/** Only the organization's list is searched on the server; a contest's few problems are searched here. */
const onFilter = (text: string) => {
  if (props.source.kind === 'organization') typed.value = text;
};
</script>

<template>
  <div class="flex flex-col gap-1">
    <span :id="labelId" class="text-sm text-muted">{{ $t(labelKey) }}</span>
    <Select
      :model-value="code || ANY_PROBLEM"
      :placeholder="anyLabel"
      :options="options"
      option-label="label"
      option-value="code"
      filter
      show-clear
      :filter-placeholder="$t('submissions.rail.problemSearch')"
      :loading="orgProblems.isFetching.value"
      :aria-labelledby="labelId"
      data-testid="problem-picker"
      class="h-11 w-full"
      @filter="onFilter($event.value)"
      @update:model-value="emit('pick', $event ?? '')"
    >
      <template #dropdownicon><ChevronDown class="size-4" aria-hidden="true" /></template>
    </Select>
  </div>
</template>
