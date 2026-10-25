<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CaseChecker } from '@/api/types/problem-data';
import { ArrowDown, ArrowUp, X } from 'lucide-vue-next';
import { INPUT, iconButtonClass } from '../../ui/controls';
import { numberBoxValue } from '../../ui/form/number-box';
import { argsText, parseArgs } from './test-cases';
import type { KeyedCase } from './test-cases';

const row = defineModel<KeyedCase>({ required: true });
const props = defineProps<{
  index: number;
  isFirst: boolean;
  isLast: boolean;
  messages: string[];
}>();
const emit = defineEmits<{
  move: [offset: -1 | 1];
  remove: [];
  invalid: [isInvalid: boolean];
}>();

const rowNumber = computed(() => props.index + 1);
const CELL = 'border-b border-line px-2 py-2 align-top';
const ICON = iconButtonClass('ghost', 'sm');
const argsDraft = ref(argsText(row.value.checkerArgs));
const CASE_CHECKERS: CaseChecker[] = [
  '',
  'floats',
  'floatsabs',
  'floatsrel',
  'identical',
  'linecount',
];

/** A args box that is not a JSON object is reported up (the list refuses to save) and the stored value stays. */
function onArgsInput(text: string) {
  argsDraft.value = text;
  const parsed = parseArgs(text);
  emit('invalid', parsed === undefined);
  if (parsed !== undefined) row.value.checkerArgs = parsed;
}

function setOptionalNumber(field: 'points' | 'outputPrefix' | 'outputLimit', event: Event) {
  row.value[field] = numberBoxValue(event);
}
</script>

<template>
  <tr>
    <th scope="row" :class="[CELL, 'sticky left-0 z-10 bg-surface text-left']">
      <p class="mb-1 font-mono text-xs font-semibold tabular-nums">
        {{ $t('admin.problems.data.cases.rowLabel', { row: rowNumber }) }}
      </p>
      <div class="flex gap-0.5">
        <button
          type="button"
          :class="ICON"
          :disabled="isFirst"
          :aria-label="$t('admin.problems.data.cases.moveUp', { row: rowNumber })"
          :title="$t('admin.problems.data.cases.moveUp', { row: rowNumber })"
          @click="emit('move', -1)"
        >
          <ArrowUp aria-hidden="true" class="size-4" :stroke-width="1.75" />
        </button>
        <button
          type="button"
          :class="ICON"
          :disabled="isLast"
          :aria-label="$t('admin.problems.data.cases.moveDown', { row: rowNumber })"
          :title="$t('admin.problems.data.cases.moveDown', { row: rowNumber })"
          @click="emit('move', 1)"
        >
          <ArrowDown aria-hidden="true" class="size-4" :stroke-width="1.75" />
        </button>
        <button
          type="button"
          :class="[ICON, 'text-negative']"
          :aria-label="$t('admin.problems.data.cases.remove', { row: rowNumber })"
          :title="$t('admin.problems.data.cases.remove', { row: rowNumber })"
          @click="emit('remove')"
        >
          <X aria-hidden="true" class="size-4" :stroke-width="1.75" />
        </button>
      </div>
    </th>
    <td :class="CELL">
      <label :for="`case-${index}-type`" class="sr-only">{{
        $t('admin.problems.data.cases.columns.type')
      }}</label>
      <select :id="`case-${index}-type`" v-model="row.type" :class="[INPUT, 'min-w-32']">
        <option value="C">{{ $t('admin.problems.data.cases.types.C') }}</option>
        <option value="S">{{ $t('admin.problems.data.cases.types.S') }}</option>
        <option value="E">{{ $t('admin.problems.data.cases.types.E') }}</option>
      </select>
    </td>
    <td :class="CELL">
      <template v-if="row.type === 'C'">
        <label :for="`case-${index}-input`" class="sr-only">{{
          $t('admin.problems.data.cases.columns.input')
        }}</label>
        <input
          :id="`case-${index}-input`"
          v-model="row.input"
          :class="[INPUT, 'min-w-40 font-mono']"
          list="archive-files"
          autocomplete="off"
        />
        <label :for="`case-${index}-output`" class="sr-only">{{
          $t('admin.problems.data.cases.columns.output')
        }}</label>
        <input
          :id="`case-${index}-output`"
          v-model="row.output"
          :class="[INPUT, 'min-w-40 font-mono']"
          list="archive-files"
          autocomplete="off"
        />
      </template>
      <p v-else-if="row.type === 'S'" class="font-semibold">
        {{ $t('admin.problems.data.cases.batchLabel', { n: rowNumber }) }}
      </p>
    </td>
    <td :class="CELL">
      <label :for="`case-${index}-points`" class="sr-only">{{
        $t('admin.problems.data.cases.columns.points')
      }}</label>
      <input
        v-if="row.type !== 'E'"
        :id="`case-${index}-points`"
        :value="row.points ?? ''"
        type="number"
        min="0"
        :class="[INPUT, 'w-24 font-mono tabular-nums']"
        @input="setOptionalNumber('points', $event)"
      />
      <label v-if="row.type === 'C'" class="mt-1 flex min-h-8 items-center gap-2 text-sm">
        <input v-model="row.isPretest" type="checkbox" class="size-4 accent-accent" />
        {{ $t('admin.problems.data.cases.pretest') }}
      </label>
    </td>
    <td :class="CELL">
      <details>
        <summary class="min-h-8 cursor-pointer content-center font-semibold whitespace-nowrap">
          {{ $t('admin.problems.data.cases.columns.options') }}
        </summary>
        <div class="mt-2 flex w-64 flex-col gap-2">
          <label :for="`case-${index}-generatorArgs`" class="text-sm">{{
            $t('admin.problems.data.cases.generatorArgs')
          }}</label>
          <input
            :id="`case-${index}-generatorArgs`"
            v-model="row.generatorArgs"
            :class="INPUT"
            autocomplete="off"
          />
          <label :for="`case-${index}-checker`" class="text-sm">{{
            $t('admin.problems.data.cases.caseChecker')
          }}</label>
          <select :id="`case-${index}-checker`" v-model="row.checker" :class="INPUT">
            <option v-for="option in CASE_CHECKERS" :key="option || 'inherit'" :value="option">
              {{
                option
                  ? $t(`admin.problems.data.checkers.${option}`)
                  : $t('admin.problems.data.cases.caseCheckerInherit')
              }}
            </option>
          </select>
          <label :for="`case-${index}-checkerArgs`" class="text-sm">{{
            $t('admin.problems.data.cases.caseArgs')
          }}</label>
          <input
            :id="`case-${index}-checkerArgs`"
            :value="argsDraft"
            :class="INPUT"
            autocomplete="off"
            :aria-invalid="parseArgs(argsDraft) === undefined ? 'true' : undefined"
            @input="onArgsInput(($event.target as HTMLInputElement).value)"
          />
          <label :for="`case-${index}-outputPrefix`" class="text-sm">{{
            $t('admin.problems.data.checker.outputPrefix')
          }}</label>
          <input
            :id="`case-${index}-outputPrefix`"
            :value="row.outputPrefix ?? ''"
            type="number"
            min="0"
            :class="INPUT"
            @input="setOptionalNumber('outputPrefix', $event)"
          />
          <label :for="`case-${index}-outputLimit`" class="text-sm">{{
            $t('admin.problems.data.checker.outputLimit')
          }}</label>
          <input
            :id="`case-${index}-outputLimit`"
            :value="row.outputLimit ?? ''"
            type="number"
            min="0"
            :class="INPUT"
            @input="setOptionalNumber('outputLimit', $event)"
          />
        </div>
      </details>
    </td>
    <td :class="CELL">
      <ul class="flex max-w-56 flex-col gap-1 text-xs text-negative">
        <li v-for="message in messages" :key="message">{{ message }}</li>
      </ul>
    </td>
  </tr>
</template>
