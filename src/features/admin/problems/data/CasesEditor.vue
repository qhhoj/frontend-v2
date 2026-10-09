<script setup lang="ts">
import { computed } from 'vue';
import { translate } from '@/i18n';
import type { ProblemData } from '@/api/types/problem-data';
import SettingsCard from '@/features/account/settings/SettingsCard.vue';
import { ADMIN_BUTTON_CLASS } from '../../ui/classes';
import CaseRow from './CaseRow.vue';
import {
  addBatch,
  addCase,
  caseCount,
  listWarnings,
  MASS_TESTCASE_LIMIT,
  moveCase,
  removeCase,
} from './test-cases';
import type { KeyedCase, ListWarning } from './test-cases';
import type { FieldErrors } from '../../ui/admin-errors';

const cases = defineModel<KeyedCase[]>({ required: true });
const props = defineProps<{ data: ProblemData; errors: FieldErrors }>();
const emit = defineEmits<{ invalid: [key: number, isInvalid: boolean] }>();

const warnings = computed(() => listWarnings({ cases: cases.value }, props.data));
const isOverSoft = computed(() => warnings.value.some((warning) => warning.kind === 'over-soft'));
const isOverMax = computed(() => warnings.value.some((warning) => warning.kind === 'over-max'));
const countLine = computed(() => {
  const count = caseCount(cases.value);
  return isOverSoft.value
    ? translate('admin.problems.data.cases.countOver', { count, soft: props.data.limits.softCases })
    : translate('admin.problems.data.cases.count', { count });
});

function warningTextOf(warning: ListWarning): string {
  if (warning.kind === 'missing-file')
    return translate('admin.problems.data.cases.warnings.missingFile', {
      file: warning.file ?? '',
    });
  if (warning.kind === 'unclosed-batch')
    return translate('admin.problems.data.cases.warnings.unclosedBatch');
  return translate('admin.problems.data.cases.warnings.strayEnd');
}
/** A row's messages: its list warnings, then the refusals its fields would get from the backend. */
const messagesAt = (index: number) => {
  const prefix = `cases.${index}.`;
  const rowErrors = Object.entries(props.errors)
    .filter(([key]) => key.startsWith(prefix))
    .map(([, text]) => text);
  return [
    ...warnings.value.filter((warning) => warning.index === index).map(warningTextOf),
    ...rowErrors,
  ];
};

function move(index: number, offset: -1 | 1) {
  cases.value = moveCase(cases.value, index, offset);
}

/** A removed row's args box goes with it: it must not keep the list from saving. */
function remove(index: number) {
  emit('invalid', cases.value[index]!.key, false);
  cases.value = removeCase(cases.value, index);
}
</script>

<template>
  <SettingsCard :title="$t('admin.problems.data.cases.title')">
    <div class="flex flex-col gap-1 text-sm">
      <p class="font-semibold">{{ countLine }}</p>
      <p v-if="isOverMax" role="alert" class="text-negative">
        {{ $t('admin.problems.data.cases.overMax', { max: data.limits.maxCases }) }}
      </p>
      <p v-if="errors.cases" role="alert" class="text-negative">{{ errors.cases }}</p>
      <p v-if="data.limits.maxCases < MASS_TESTCASE_LIMIT" class="text-xs text-muted">
        {{ $t('admin.problems.data.cases.hardLimit', { max: MASS_TESTCASE_LIMIT }) }}
      </p>
    </div>
    <datalist id="archive-files">
      <option v-for="file in data.archiveFiles" :key="file" :value="file" />
    </datalist>
    <table class="block w-full sm:table">
      <caption class="sr-only">
        {{
          $t('admin.problems.data.cases.title')
        }}
      </caption>
      <thead class="hidden sm:table-header-group">
        <tr class="text-left text-sm text-muted">
          <th scope="col" class="p-2">{{ $t('admin.problems.data.cases.columns.order') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.data.cases.columns.type') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.data.cases.columns.input') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.data.cases.columns.points') }}</th>
          <th scope="col" class="p-2">{{ $t('admin.problems.data.cases.columns.options') }}</th>
          <th scope="col" class="p-2"></th>
        </tr>
      </thead>
      <tbody class="block sm:table-row-group">
        <CaseRow
          v-for="(row, index) in cases"
          :key="row.key"
          :model-value="row"
          :index="index"
          :is-first="index === 0"
          :is-last="index === cases.length - 1"
          :messages="messagesAt(index)"
          @move="move(index, $event)"
          @remove="remove(index)"
          @invalid="emit('invalid', row.key, $event)"
        />
      </tbody>
    </table>
    <div class="flex flex-wrap gap-2">
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="cases = addCase(cases)">
        {{ $t('admin.problems.data.cases.addCase') }}
      </button>
      <button type="button" :class="ADMIN_BUTTON_CLASS" @click="cases = addBatch(cases)">
        {{ $t('admin.problems.data.cases.addBatch') }}
      </button>
    </div>
    <p class="text-xs text-muted">{{ $t('admin.problems.data.cases.legend') }}</p>
  </SettingsCard>
</template>
