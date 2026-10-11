<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Select from 'primevue/select';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useDebouncedText } from '@/lib/use-debounced-text';
import { useLocaleStore } from '@/stores/locale.store';
import { useOrgProblemsQuery } from '../problems/org-problems.queries';

/**
 * The submission rail's problem filter for an organization: only its problems (archived ones too), searched on the
 * server by code or name as the viewer types. `code` is '' for every problem.
 */
const props = defineProps<{ slug: string; code: string }>();
const emit = defineEmits<{ pick: [code: string] }>();
const locale = useLocaleStore();
/** Select shows its placeholder for null, not for ''. */
const ANY_PROBLEM = null;
const LABEL_ID = 'org-problem-picker-label';

const search = ref('');
const typed = useDebouncedText(
  () => search.value,
  (text) => (search.value = text),
);
const filters = computed(() => ({
  tag: null,
  archived: 'all' as const,
  q: search.value,
  page: 1,
}));
const problems = useOrgProblemsQuery(() => props.slug, filters, true);

const anyLabel = computed(() => {
  const page = problems.data.value;
  return page && !search.value
    ? translate('orgAdmin.submissions.anyProblemCount', {
        count: formatNumber(page.meta.total ?? page.items.length, locale.locale),
      })
    : translate('orgAdmin.submissions.anyProblem');
});
const options = computed(() => {
  const page = problems.data.value;
  const listed = (page?.items ?? []).map((problem) => ({
    code: problem.code,
    label: `${problem.code} · ${problem.name}`,
  }));
  // A picked problem a later search left out keeps its row, so the box still names it.
  const keepsPicked = props.code && !listed.some((option) => option.code === props.code);
  return [
    { code: ANY_PROBLEM, label: anyLabel.value },
    ...(keepsPicked ? [{ code: props.code, label: props.code }] : []),
    ...listed,
  ];
});
</script>

<template>
  <div class="flex flex-col gap-1">
    <span :id="LABEL_ID" class="text-[13px] text-muted">{{
      $t('orgAdmin.submissions.problemLabel')
    }}</span>
    <Select
      :model-value="code || ANY_PROBLEM"
      :placeholder="anyLabel"
      :options="options"
      option-label="label"
      option-value="code"
      filter
      :filter-placeholder="$t('orgAdmin.submissions.problemSearch')"
      :loading="problems.isFetching.value"
      :aria-labelledby="LABEL_ID"
      class="h-11 w-full"
      @filter="typed = $event.value"
      @update:model-value="emit('pick', $event ?? '')"
    >
      <template #dropdownicon><ChevronDown class="size-4" aria-hidden="true" /></template>
    </Select>
  </div>
</template>
