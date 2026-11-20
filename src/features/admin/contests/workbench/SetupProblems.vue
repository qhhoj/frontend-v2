<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown, ArrowUp, X } from 'lucide-vue-next';
import type { LabelStyle } from '@/api/types/contest-editing';
import AppButton from '@/components/ui/AppButton.vue';
import Checkbox from '@/components/ui/Checkbox.vue';
import DataTable from '@/components/ui/DataTable.vue';
import type { DataTableColumn } from '@/components/ui/DataTableColumns';
import FoldPanel from '@/components/ui/FoldPanel.vue';
import IconButton from '@/components/ui/IconButton.vue';
import Notice from '@/components/ui/Notice.vue';
import TextInput from '@/components/ui/TextInput.vue';
import ProblemSetupMark from '../../search/ProblemSetupMark.vue';
import { nextListStep } from '../../search/problem-setup-marks';
import type { ListStep } from '../../search/problem-setup-marks';
import { numberBoxValue, requiredNumberValue } from '../../ui/form/number-box';
import ProblemAddPicker from '../problems/ProblemAddPicker.vue';
import ProblemCopyFrom from '../problems/ProblemCopyFrom.vue';
import { isPointsValid, labelFor } from '../problems/contest-problems';
import type { ProblemRow } from '../problems/contest-problems';
import type { ContestWorkbenchState } from './use-contest-workbench';

/**
 * The contest's problems as one draft, saved by the page's save bar: label, name and code, each problem's setup mark
 * (the same four segments as "Bài tập của tôi"), points and partial scoring; add by search, copy from another contest,
 * move and remove. A problem whose setup is not finished links to the step that is next in that problem's workbench.
 * A problem the viewer may not edit has no mark.
 */
const props = defineProps<{
  contestKey: string;
  labelStyle: LabelStyle;
  problems: ContestWorkbenchState['problems'];
  marks: ReadonlyMap<string, readonly ListStep[]>;
}>();
const { t } = useI18n();
const KEY = 'admin.contests.problems';
const BENCH = 'admin.contests.workbench.problems';
const { rows, addError, isAdding, isFull, addByCode, addFound } = props.problems;
const listedIds = computed(() => rows.value.map((row) => row.problemId));
const indexOf = (row: ProblemRow) =>
  rows.value.findIndex((listed) => listed.problemId === row.problemId);
const labelOf = (row: ProblemRow) => labelFor(indexOf(row), props.labelStyle);

/** The step to do next in the problem's own workbench; null when the problem is ready or carries no mark. */
function nextOf(row: ProblemRow) {
  const step = nextListStep(props.marks.get(row.code) ?? []);
  if (!step) return null;
  return {
    to: { name: step.routeName, params: { code: row.code } },
    label: t(`admin.problemList.next.${step.action}`),
  };
}

/** Output prefix and submission cap are rarely set: their columns show on request, or once a row has one. */
const showLimits = ref(false);
watch(
  () => rows.value.some((row) => row.outputPrefix !== null || row.maxSubmissions !== null),
  (has) => {
    if (has) showLimits.value = true;
  },
  { immediate: true },
);
const columns = computed<DataTableColumn[]>(() => [
  { key: 'label', label: t(`${KEY}.columns.label`), priority: 'badge' },
  { key: 'problem', label: t(`${KEY}.columns.problem`), priority: 'primary' },
  { key: 'setup', label: t(`${BENCH}.setup`), priority: 'secondary' },
  { key: 'points', label: t(`${KEY}.columns.points`), priority: 'secondary', cellClass: 'w-28' },
  { key: 'partial', label: t(`${KEY}.columns.partial`), priority: 'secondary' },
  { key: 'pretest', label: t(`${KEY}.columns.pretest`), priority: 'meta', hideBelow: 'lg' },
  ...(showLimits.value
    ? [
        { key: 'prefix', label: t(`${KEY}.columns.prefix`), priority: 'meta' as const },
        { key: 'max', label: t(`${KEY}.columns.maxSubmissions`), priority: 'meta' as const },
      ]
    : []),
]);

const selected = ref(new Set<string>());
const bulkPoints = ref<number>(Number.NaN);
const isBulkPointsValid = computed(() => isPointsValid(bulkPoints.value));
function applyPoints() {
  if (isBulkPointsValid.value) props.problems.setPoints([...selected.value], bulkPoints.value);
}
function removeRow(row: ProblemRow) {
  const next = new Set(selected.value);
  next.delete(row.problemId);
  selected.value = next;
  props.problems.remove(indexOf(row));
}
/** A position typed out of range is clamped by the list; an empty or non-number box does nothing. */
function commitPosition(row: ProblemRow, event: Event) {
  const input = event.target as HTMLInputElement;
  const from = indexOf(row);
  const typed = Number.parseInt(input.value, 10);
  if (Number.isInteger(typed) && typed !== from + 1) props.problems.moveTo(from, typed - 1);
  input.value = String(indexOf(row) + 1);
}
const isCopyOpen = ref(false);
const total = computed(() =>
  rows.value.reduce((sum, row) => sum + (isPointsValid(row.points) ? row.points : 0), 0),
);
</script>

<template>
  <div class="flex flex-col gap-3" data-testid="contest-problems">
    <DataTable
      v-model:selected="selected"
      :columns="columns"
      :rows="rows"
      :row-key="(row) => row.problemId"
      :row-label="(row) => row.name"
      :label="$t(`${KEY}.tableLabel`)"
      :empty-text="$t(`${KEY}.empty`)"
      selectable
      density="compact"
    >
      <template #bulk>
        <span class="block w-24">
          <TextInput
            :model-value="Number.isNaN(bulkPoints) ? '' : bulkPoints"
            type="number"
            min="0"
            class="font-mono"
            :aria-label="$t(`${KEY}.bulkPoints`)"
            :placeholder="$t(`${KEY}.bulkPoints`)"
            :aria-invalid="!Number.isNaN(bulkPoints) && !isBulkPointsValid ? 'true' : undefined"
            @input="bulkPoints = requiredNumberValue($event)"
            @keydown.enter.prevent="applyPoints"
          />
        </span>
        <AppButton
          size="sm"
          :disabled="!isBulkPointsValid"
          :disabled-reason="isBulkPointsValid ? undefined : $t(`${KEY}.pointsRange`)"
          @click="applyPoints"
        >
          {{ $t(`${KEY}.applyPoints`) }}
        </AppButton>
      </template>
      <template #cell-label="{ row }">
        <span class="font-mono font-semibold">{{ labelOf(row) }}</span>
      </template>
      <template #cell-problem="{ row }">
        <span class="flex min-w-0 flex-col">
          <span class="font-semibold">{{ row.name }}</span>
          <span data-testid="code" class="font-mono text-small text-muted">{{ row.code }}</span>
          <Notice v-if="problems.issueFor(indexOf(row))" tone="danger" inline>{{
            problems.issueFor(indexOf(row))
          }}</Notice>
        </span>
      </template>
      <template #cell-setup="{ row }">
        <span class="flex items-center gap-2 whitespace-nowrap" :data-setup="row.code">
          <ProblemSetupMark v-if="marks.get(row.code)" :steps="marks.get(row.code)!" />
          <AppButton v-if="nextOf(row)" tone="link" :to="nextOf(row)!.to">{{
            nextOf(row)!.label
          }}</AppButton>
        </span>
      </template>
      <template #cell-points="{ row }">
        <span class="block w-24">
          <TextInput
            :model-value="Number.isNaN(row.points) ? '' : row.points"
            type="number"
            min="0"
            class="font-mono"
            :aria-label="$t(`${KEY}.pointsFor`, { code: row.code })"
            :aria-invalid="isPointsValid(row.points) ? undefined : 'true'"
            @input="row.points = requiredNumberValue($event)"
          />
        </span>
      </template>
      <template #cell-partial="{ row }">
        <Checkbox v-model="row.partial" :aria-label="$t(`${KEY}.partialFor`, { code: row.code })" />
      </template>
      <template #cell-pretest="{ row }">
        <Checkbox
          v-model="row.isPretested"
          :aria-label="$t(`${KEY}.pretestFor`, { code: row.code })"
        />
      </template>
      <template #cell-prefix="{ row }">
        <span class="block w-24">
          <TextInput
            :model-value="row.outputPrefix ?? ''"
            type="number"
            min="0"
            class="font-mono"
            :placeholder="$t(`${KEY}.prefixDefault`)"
            :aria-label="$t(`${KEY}.prefixFor`, { code: row.code })"
            @input="row.outputPrefix = numberBoxValue($event)"
          />
        </span>
      </template>
      <template #cell-max="{ row }">
        <span class="block w-24">
          <TextInput
            :model-value="row.maxSubmissions ?? ''"
            type="number"
            min="1"
            class="font-mono"
            :placeholder="$t(`${KEY}.maxNone`)"
            :aria-label="$t(`${KEY}.maxFor`, { code: row.code })"
            @input="row.maxSubmissions = numberBoxValue($event)"
          />
        </span>
      </template>
      <template #actions="{ row }">
        <span class="flex items-center justify-end gap-1">
          <span class="block w-16">
            <TextInput
              :model-value="indexOf(row) + 1"
              type="number"
              min="1"
              :max="rows.length"
              class="font-mono"
              :aria-label="$t(`${KEY}.positionFor`, { code: row.code })"
              @change="commitPosition(row, $event)"
              @keydown.enter.prevent="commitPosition(row, $event)"
            />
          </span>
          <IconButton
            size="sm"
            :label="$t(`${KEY}.moveUp`, { code: row.code })"
            :disabled="indexOf(row) === 0"
            @click="problems.move(indexOf(row), -1)"
          >
            <ArrowUp aria-hidden="true" />
          </IconButton>
          <IconButton
            size="sm"
            :label="$t(`${KEY}.moveDown`, { code: row.code })"
            :disabled="indexOf(row) === rows.length - 1"
            @click="problems.move(indexOf(row), 1)"
          >
            <ArrowDown aria-hidden="true" />
          </IconButton>
          <IconButton
            size="sm"
            :label="$t(`${KEY}.remove`, { code: row.code })"
            @click="removeRow(row)"
          >
            <X aria-hidden="true" />
          </IconButton>
        </span>
      </template>
    </DataTable>
    <p v-if="rows.length" class="m-0 text-meta text-muted" data-testid="contest-problems-total">
      {{ $t(`${BENCH}.total`, { count: rows.length, points: total }) }}
    </p>
    <div class="flex flex-wrap items-start gap-2">
      <ProblemAddPicker
        class="min-w-0 flex-1 basis-72"
        :listed-ids="listedIds"
        :is-full="isFull"
        :is-adding="isAdding"
        :error="addError"
        :add-by-code="addByCode"
        @pick="addFound"
      />
      <AppButton
        :aria-expanded="isCopyOpen"
        data-testid="contest-copy-toggle"
        @click="isCopyOpen = !isCopyOpen"
      >
        {{ $t(`${KEY}.copyLabel`) }}
      </AppButton>
      <AppButton
        tone="quiet"
        :pressed="showLimits"
        data-testid="contest-limits-toggle"
        @click="showLimits = !showLimits"
      >
        {{ $t(`${BENCH}.${showLimits ? 'hideLimits' : 'showLimits'}`) }}
      </AppButton>
    </div>
    <FoldPanel :open="isCopyOpen">
      <ProblemCopyFrom :current-key="contestKey" :copy="problems.copyRows" />
    </FoldPanel>
    <Notice v-if="problems.dirtyCount.value > 0" tone="info" inline>
      {{ $t(`${BENCH}.rescore`) }}
    </Notice>
  </div>
</template>
