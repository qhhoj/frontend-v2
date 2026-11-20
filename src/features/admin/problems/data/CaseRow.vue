<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { ArrowDown, ArrowUp, Plus, SlidersHorizontal, Trash2, X } from 'lucide-vue-next';
import type { CaseChecker } from '@/api/types/problem-data';
import Checkbox from '@/components/ui/Checkbox.vue';
import Chip from '@/components/ui/Chip.vue';
import FormField from '@/components/ui/FormField.vue';
import IconButton from '@/components/ui/IconButton.vue';
import type { MenuEntry } from '@/components/ui/Menu.vue';
import Notice from '@/components/ui/Notice.vue';
import RowMenu from '@/components/ui/RowMenu.vue';
import SelectField from '@/components/ui/SelectField.vue';
import TextInput from '@/components/ui/TextInput.vue';
import { TABLE_ROW_HEIGHT } from '@/components/ui/table-classes';
import { numberBoxValue } from '../../ui/form/number-box';
import { argsText, parseArgs } from './test-cases';
import type { KeyedCase } from './test-cases';
import CaseTrialResult from './CaseTrialResult.vue';
import type { TableRow } from './test-table';
import type { TrialResults } from './trial-results';

/**
 * One row of the test table. A group row sits on the raised ground with the group's points and its rule in words; a test
 * row has its number, input file, output file and points (a dash inside a group: the group's points score it). Moving,
 * removing and the rarely used options are behind the row's menu; the options open as a row below. A row that has
 * something to fix says so in a line under it. With `trial` the row has the cell "Lời giải mẫu" (what the last trial run
 * got on this test or group); a phone shows it as a second line of the row once there is a run.
 */
const row = defineModel<KeyedCase>({ required: true });
const props = defineProps<{
  view: TableRow;
  canMoveUp: boolean;
  canMoveDown: boolean;
  warnings: string[];
  errors: string[];
  trial?: TrialResults;
}>();
const emit = defineEmits<{
  move: [offset: -1 | 1];
  remove: [];
  addTest: [];
  invalid: [isInvalid: boolean];
}>();
const { t } = useI18n();
const KEY = 'admin.problems.data.cases';
const BASE_COLUMN_COUNT = 5;
const columnCount = computed(() => BASE_COLUMN_COUNT + (props.trial ? 1 : 0));
const trialResult = computed(() => {
  if (props.view.kind === 'group') return props.trial?.groups.get(props.view.number);
  return props.view.kind === 'test' ? props.trial?.tests.get(props.view.number) : undefined;
});
/** On a phone the trial cell is a line under the row, shown once a run exists; the row's own rule then moves under it. */
const hasTrialLine = computed(
  () =>
    props.trial !== undefined && props.trial.phase !== 'none' && props.view.kind !== 'stray-end',
);
const ruleClass = computed(() =>
  hasTrialLine.value ? 'border-b border-line max-sm:border-b-0' : 'border-b border-line',
);
const cellClass = computed(() => `${ruleClass.value} px-2 py-0.5`);
/** The menu's cell has no side padding: on a phone the button alone is the 44 px target. */
const menuCellClass = computed(() => `${ruleClass.value} py-0.5 text-right`);
const trialCellClass = computed(() => `${cellClass.value} text-right max-sm:hidden`);
const CASE_CHECKERS: CaseChecker[] = [
  '',
  'floats',
  'floatsabs',
  'floatsrel',
  'identical',
  'linecount',
];
const checkerOptions = computed(() =>
  CASE_CHECKERS.map((value) => ({
    value,
    label: value ? t(`admin.problems.data.checkers.${value}`) : t(`${KEY}.caseCheckerInherit`),
  })),
);

const isGroup = computed(() => props.view.kind === 'group');
const names = computed(() => ({ row: props.view.number, n: props.view.number }));
const argsDraft = ref(argsText(row.value.checkerArgs));
const isArgsInvalid = computed(() => parseArgs(argsDraft.value) === undefined);
/** An args box that is not a JSON object is reported up (the list refuses to save) and the stored value stays. */
function onArgsInput(event: Event) {
  argsDraft.value = (event.target as HTMLInputElement).value;
  const parsed = parseArgs(argsDraft.value);
  emit('invalid', parsed === undefined);
  if (parsed !== undefined) row.value.checkerArgs = parsed;
}

/** Options that differ from a plain row: said on the row, so nothing that changes judging hides behind the menu. */
const hasOptions = computed(
  () =>
    row.value.generatorArgs !== '' ||
    row.value.checker !== '' ||
    row.value.checkerArgs !== null ||
    row.value.outputPrefix !== null ||
    row.value.outputLimit !== null,
);
const isOptionsOpen = ref(false);
/** The options stay in view while their args box holds something to fix. */
const isOptionsShown = computed(() => isOptionsOpen.value || isArgsInvalid.value);

const menu = computed<MenuEntry[]>(() => {
  const kind = isGroup.value ? 'group' : 'test';
  const entries: MenuEntry[] = [
    {
      label: t(`${KEY}.menu.${isOptionsOpen.value ? 'hideOptions' : `${kind}Options`}`),
      icon: SlidersHorizontal,
      run: () => (isOptionsOpen.value = !isOptionsOpen.value),
    },
    {
      label: t(`${KEY}.menu.${kind}Up`, names.value),
      icon: ArrowUp,
      disabled: !props.canMoveUp,
      run: () => emit('move', -1),
    },
    {
      label: t(`${KEY}.menu.${kind}Down`, names.value),
      icon: ArrowDown,
      disabled: !props.canMoveDown,
      run: () => emit('move', 1),
    },
    {
      label: t(`${KEY}.menu.${kind}Remove`, names.value),
      icon: Trash2,
      danger: true,
      run: () => emit('remove'),
    },
  ];
  if (!isGroup.value) return entries;
  const addTest = { label: t(`${KEY}.menu.groupAdd`, names.value), icon: Plus };
  return [{ ...addTest, run: () => emit('addTest') }, ...entries];
});
</script>

<template>
  <tr
    v-if="view.kind === 'group'"
    data-testid="group-row"
    :class="[TABLE_ROW_HEIGHT, 'bg-surface-strong']"
  >
    <th scope="row" colspan="3" :class="[cellClass, 'text-left font-normal']">
      <span class="font-semibold">{{ t(`${KEY}.batchLabel`, names) }}</span>
      <span class="ml-2 text-meta text-muted">{{ t(`${KEY}.groupRule`) }}</span>
      <Chip v-if="hasOptions" class="ml-2">{{ t(`${KEY}.hasOptions`) }}</Chip>
    </th>
    <td :class="cellClass">
      <TextInput
        :model-value="row.points ?? ''"
        type="number"
        min="0"
        inputmode="numeric"
        class="text-right font-mono font-semibold tabular-nums"
        :data-testid="`case-${view.index}-points`"
        :aria-label="t(`${KEY}.groupPoints`, names)"
        @input="row.points = numberBoxValue($event)"
      />
    </td>
    <td v-if="trial" :class="trialCellClass">
      <CaseTrialResult :result="trialResult" :phase="trial.phase" :is-stale="trial.isStale" />
    </td>
    <td :class="menuCellClass">
      <RowMenu :items="menu" :label="t(`${KEY}.menu.group`, names)" />
    </td>
  </tr>
  <tr v-else-if="view.kind === 'test'" data-testid="test-row" :class="TABLE_ROW_HEIGHT">
    <th scope="row" :class="[cellClass, 'text-left font-normal whitespace-nowrap']">
      <span class="font-mono tabular-nums">{{ view.number }}</span>
      <Chip v-if="row.isPretest" class="ml-2">{{ t(`${KEY}.pretest`) }}</Chip>
      <Chip v-if="hasOptions" class="ml-2">{{ t(`${KEY}.hasOptions`) }}</Chip>
    </th>
    <td :class="cellClass">
      <TextInput
        v-model="row.input"
        class="font-mono"
        list="archive-files"
        autocomplete="off"
        spellcheck="false"
        :data-testid="`case-${view.index}-input`"
        :aria-label="t(`${KEY}.inputOf`, names)"
      />
    </td>
    <td :class="cellClass">
      <TextInput
        v-model="row.output"
        class="font-mono"
        list="archive-files"
        autocomplete="off"
        spellcheck="false"
        :data-testid="`case-${view.index}-output`"
        :aria-label="t(`${KEY}.outputOf`, names)"
      />
    </td>
    <td :class="[cellClass, 'text-right']">
      <template v-if="view.isInGroup">
        <span aria-hidden="true" class="px-2 text-muted">—</span>
        <span class="sr-only">{{ t(`${KEY}.scoredByGroup`) }}</span>
      </template>
      <TextInput
        v-else
        :model-value="row.points ?? ''"
        type="number"
        min="0"
        inputmode="numeric"
        class="text-right font-mono tabular-nums"
        :data-testid="`case-${view.index}-points`"
        :aria-label="t(`${KEY}.pointsOf`, names)"
        @input="row.points = numberBoxValue($event)"
      />
    </td>
    <td v-if="trial" :class="trialCellClass">
      <CaseTrialResult :result="trialResult" :phase="trial.phase" :is-stale="trial.isStale" />
    </td>
    <td :class="menuCellClass">
      <RowMenu :items="menu" :label="t(`${KEY}.menu.test`, names)" />
    </td>
  </tr>
  <tr v-else data-testid="stray-end-row" :class="TABLE_ROW_HEIGHT">
    <td :colspan="columnCount - 1" :class="[cellClass, 'text-meta text-muted']">
      {{ t(`${KEY}.strayEnd`) }}
    </td>
    <td :class="menuCellClass">
      <IconButton size="sm" :label="t(`${KEY}.removeStrayEnd`)" @click="emit('remove')">
        <X aria-hidden="true" />
      </IconButton>
    </td>
  </tr>
  <tr v-if="trial && hasTrialLine" data-testid="trial-line" class="sm:hidden">
    <td :colspan="columnCount" class="border-b border-line px-2 pb-2">
      <span class="flex items-center gap-2">
        <span class="text-small text-muted">{{ t(`${KEY}.trial.of`) }}</span>
        <CaseTrialResult :result="trialResult" :phase="trial.phase" :is-stale="trial.isStale" />
      </span>
    </td>
  </tr>
  <tr v-if="errors.length > 0 || warnings.length > 0" data-testid="row-messages">
    <td :colspan="columnCount" class="border-b border-line px-2 py-0.5 pb-2">
      <Notice v-if="errors.length > 0" tone="danger" inline>{{ errors.join(' · ') }}</Notice>
      <Notice v-if="warnings.length > 0" tone="warning" inline>{{ warnings.join(' · ') }}</Notice>
    </td>
  </tr>
  <tr v-if="isOptionsShown && view.kind !== 'stray-end'" data-testid="row-options">
    <td :colspan="columnCount" class="border-b border-line bg-surface-strong p-3">
      <div class="grid gap-3 sm:grid-cols-2">
        <Checkbox
          v-if="!isGroup"
          v-model="row.isPretest"
          class="sm:col-span-2"
          :label="t(`${KEY}.pretest`)"
          :description="t(`${KEY}.pretestHint`)"
        />
        <FormField
          :label="t(`${KEY}.generatorArgs`)"
          :input-id="`case-${view.index}-generatorArgs`"
        >
          <TextInput v-model="row.generatorArgs" autocomplete="off" />
        </FormField>
        <FormField :label="t(`${KEY}.caseChecker`)" :input-id="`case-${view.index}-checker`">
          <SelectField v-model="row.checker" :options="checkerOptions" />
        </FormField>
        <FormField
          class="sm:col-span-2"
          :label="t(`${KEY}.caseArgs`)"
          :input-id="`case-${view.index}-checkerArgs`"
          :error="isArgsInvalid ? t('admin.problems.data.badJson') : undefined"
        >
          <TextInput
            :model-value="argsDraft"
            class="font-mono"
            autocomplete="off"
            spellcheck="false"
            @input="onArgsInput"
          />
        </FormField>
        <FormField
          v-for="field in ['outputPrefix', 'outputLimit'] as const"
          :key="field"
          :label="t(`admin.problems.data.checker.${field}`)"
          :input-id="`case-${view.index}-${field}`"
        >
          <TextInput
            :model-value="row[field] ?? ''"
            type="number"
            min="0"
            inputmode="numeric"
            @input="row[field] = numberBoxValue($event)"
          />
        </FormField>
      </div>
    </td>
  </tr>
</template>
