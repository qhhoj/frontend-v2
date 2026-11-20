<script setup lang="ts">
import { computed } from 'vue';
import { Plus } from 'lucide-vue-next';
import type { ProblemData } from '@/api/types/problem-data';
import EmptyState from '@/components/EmptyState.vue';
import ScrollRegion from '@/components/ScrollRegion.vue';
import AppButton from '@/components/ui/AppButton.vue';
import Notice from '@/components/ui/Notice.vue';
import { TABLE_HEAD_CELL } from '@/components/ui/table-classes';
import { translate } from '@/i18n';
import type { FieldErrors } from '../../ui/admin-errors';
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
import { addCaseToGroup, groupEnd, moveGroup, removeGroup, tableRows } from './test-table';
import type { TableRow } from './test-table';
import type { TrialResults } from './trial-results';

/**
 * The test table: one compact row per group and per test, visible at once. Below it the `total` slot (the page's line
 * that says whether the points add up) and "Thêm nhóm", "Thêm test". Everything waits for the page's save. With `trial`
 * the table has the column "Lời giải mẫu": what the last trial run got on each test and group (under the row on a phone).
 */
const cases = defineModel<KeyedCase[]>({ required: true });
const props = defineProps<{ data: ProblemData; errors: FieldErrors; trial?: TrialResults }>();
const emit = defineEmits<{ invalid: [key: number, isInvalid: boolean] }>();
const KEY = 'admin.problems.data.cases';
const HEAD = 'border-b border-line px-2';

const rows = computed(() => tableRows(cases.value));
const warnings = computed(() => listWarnings({ cases: cases.value }, props.data));
const isOverSoft = computed(() => warnings.value.some((warning) => warning.kind === 'over-soft'));
const isOverMax = computed(() => warnings.value.some((warning) => warning.kind === 'over-max'));

function warningTextOf(warning: ListWarning): string {
  if (warning.kind === 'missing-file')
    return translate(`${KEY}.warnings.missingFile`, { file: warning.file ?? '' });
  if (warning.kind === 'unclosed-batch') return translate(`${KEY}.warnings.unclosedBatch`);
  return translate(`${KEY}.warnings.strayEnd`);
}
const warningsAt = (index: number) =>
  warnings.value.filter((warning) => warning.index === index).map(warningTextOf);
/** The refusals a row's fields would get from the backend. */
const errorsAt = (index: number) =>
  Object.entries(props.errors)
    .filter(([key]) => key.startsWith(`cases.${index}.`))
    .map(([, text]) => text);

const canMoveDown = (shown: TableRow) =>
  (shown.kind === 'group' ? groupEnd(cases.value, shown.index) : shown.index) <
  cases.value.length - 1;

/** A group moves whole, past the test or the group next to it; a test moves one place, into or out of a group on the way. */
function move(shown: TableRow, offset: -1 | 1) {
  cases.value =
    shown.kind === 'group'
      ? moveGroup(cases.value, shown.index, offset)
      : moveCase(cases.value, shown.index, offset);
}

/** Removing a group keeps its tests. A removed test's args box goes with it: it must not keep the list from saving. */
function remove(shown: TableRow) {
  if (shown.kind === 'group') {
    cases.value = removeGroup(cases.value, shown.index);
    return;
  }
  emit('invalid', shown.row.key, false);
  cases.value = removeCase(cases.value, shown.index);
}
</script>

<template>
  <div class="flex min-w-0 flex-col gap-3" data-testid="tests-table">
    <Notice v-if="isOverMax" tone="danger" inline>
      {{ $t(`${KEY}.overMax`, { max: data.limits.maxCases }) }}
    </Notice>
    <Notice v-else-if="isOverSoft" tone="warning" inline>
      {{ $t(`${KEY}.countOver`, { count: caseCount(cases), soft: data.limits.softCases }) }}
      <template v-if="data.limits.maxCases < MASS_TESTCASE_LIMIT">
        {{
          $t(`${KEY}.hardLimit`, {
            max: MASS_TESTCASE_LIMIT,
            permission: $t('admin.permissions.judge.create_mass_testcases'),
          })
        }}
      </template>
    </Notice>
    <Notice v-if="errors.cases" tone="danger" inline>{{ errors.cases }}</Notice>
    <p v-if="trial?.isStale" data-testid="trial-stale-note" class="m-0 text-meta text-muted">
      {{ $t(`${KEY}.trial.staleNote`) }}
    </p>
    <datalist id="archive-files">
      <option v-for="file in data.archiveFiles" :key="file" :value="file" />
    </datalist>
    <ScrollRegion v-if="rows.length > 0" class="min-w-0" :label="$t(`${KEY}.title`)" no-hint>
      <table class="w-full min-w-sm border-separate border-spacing-0 text-body">
        <caption class="sr-only">
          {{
            $t(`${KEY}.title`)
          }}
        </caption>
        <thead>
          <tr class="text-left">
            <th scope="col" :class="[TABLE_HEAD_CELL, HEAD, 'w-10']">
              {{ $t(`${KEY}.columns.test`) }}
            </th>
            <th scope="col" :class="[TABLE_HEAD_CELL, HEAD]">{{ $t(`${KEY}.columns.input`) }}</th>
            <th scope="col" :class="[TABLE_HEAD_CELL, HEAD]">{{ $t(`${KEY}.columns.output`) }}</th>
            <th scope="col" :class="[TABLE_HEAD_CELL, HEAD, 'w-24 text-right']">
              {{ $t(`${KEY}.columns.points`) }}
            </th>
            <th
              v-if="trial"
              scope="col"
              :class="[TABLE_HEAD_CELL, HEAD, 'w-36 text-right max-sm:hidden']"
            >
              {{ $t(`${KEY}.columns.trial`) }}
            </th>
            <th scope="col" :class="[TABLE_HEAD_CELL, 'w-11 border-b border-line']">
              <span class="sr-only">{{ $t(`${KEY}.columns.actions`) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <CaseRow
            v-for="shown in rows"
            :key="shown.row.key"
            :model-value="shown.row"
            :view="shown"
            :can-move-up="shown.index > 0"
            :can-move-down="canMoveDown(shown)"
            :warnings="warningsAt(shown.index)"
            :errors="errorsAt(shown.index)"
            :trial="trial"
            @move="move(shown, $event)"
            @remove="remove(shown)"
            @add-test="cases = addCaseToGroup(cases, shown.index)"
            @invalid="emit('invalid', shown.row.key, $event)"
          />
        </tbody>
      </table>
    </ScrollRegion>
    <EmptyState v-else compact>
      {{ $t(`${KEY}.empty`) }}
      <template #action>
        <AppButton size="sm" tone="secondary" @click="cases = addCase(cases)">
          <template #icon><Plus aria-hidden="true" /></template>
          {{ $t(`${KEY}.addCase`) }}
        </AppButton>
      </template>
    </EmptyState>
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
      <div class="min-w-0"><slot name="total" /></div>
      <div class="ml-auto flex flex-wrap gap-2">
        <slot name="actions" />
        <AppButton size="sm" tone="secondary" @click="cases = addBatch(cases)">
          <template #icon><Plus aria-hidden="true" /></template>
          {{ $t(`${KEY}.addBatch`) }}
        </AppButton>
        <AppButton
          v-if="rows.length > 0"
          size="sm"
          tone="secondary"
          @click="cases = addCase(cases)"
        >
          <template #icon><Plus aria-hidden="true" /></template>
          {{ $t(`${KEY}.addCase`) }}
        </AppButton>
      </div>
    </div>
  </div>
</template>
