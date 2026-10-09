<script setup lang="ts">
import { computed, ref } from 'vue';
import type { CaseChecker } from '@/api/types/problem-data';
import { ADMIN_BUTTON_CLASS, ADMIN_INPUT_CLASS } from '../../ui/classes';
import { argsText, optionalNumber, parseArgs } from './test-cases';
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

function setOptionalNumber(field: 'points' | 'outputPrefix' | 'outputLimit', text: string) {
  row.value[field] = optionalNumber(text);
}
</script>

<template>
  <tr class="block border-b border-line py-3 sm:table-row">
    <td class="block p-2 sm:table-cell">
      <p class="mb-2 font-semibold">
        {{ $t('admin.problems.data.cases.rowLabel', { row: rowNumber }) }}
      </p>
      <div class="flex flex-wrap gap-1">
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :disabled="isFirst"
          :aria-label="$t('admin.problems.data.cases.moveUp', { row: rowNumber })"
          @click="emit('move', -1)"
        >
          ↑
        </button>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :disabled="isLast"
          :aria-label="$t('admin.problems.data.cases.moveDown', { row: rowNumber })"
          @click="emit('move', 1)"
        >
          ↓
        </button>
        <button
          type="button"
          :class="ADMIN_BUTTON_CLASS"
          :aria-label="$t('admin.problems.data.cases.remove', { row: rowNumber })"
          @click="emit('remove')"
        >
          ×
        </button>
      </div>
    </td>
    <td class="block p-2 sm:table-cell">
      <label :for="`case-${index}-type`" class="text-xs text-muted sm:sr-only">{{
        $t('admin.problems.data.cases.columns.type')
      }}</label>
      <select :id="`case-${index}-type`" v-model="row.type" :class="ADMIN_INPUT_CLASS">
        <option value="C">{{ $t('admin.problems.data.cases.types.C') }}</option>
        <option value="S">{{ $t('admin.problems.data.cases.types.S') }}</option>
        <option value="E">{{ $t('admin.problems.data.cases.types.E') }}</option>
      </select>
    </td>
    <td class="block p-2 sm:table-cell">
      <template v-if="row.type === 'C'">
        <label :for="`case-${index}-input`" class="text-xs text-muted sm:sr-only">{{
          $t('admin.problems.data.cases.columns.input')
        }}</label>
        <input
          :id="`case-${index}-input`"
          v-model="row.input"
          :class="ADMIN_INPUT_CLASS"
          list="archive-files"
          autocomplete="off"
        />
        <label :for="`case-${index}-output`" class="mt-2 block text-xs text-muted sm:sr-only">{{
          $t('admin.problems.data.cases.columns.output')
        }}</label>
        <input
          :id="`case-${index}-output`"
          v-model="row.output"
          :class="ADMIN_INPUT_CLASS"
          list="archive-files"
          autocomplete="off"
        />
      </template>
      <p v-else-if="row.type === 'S'" class="font-semibold">
        {{ $t('admin.problems.data.cases.batchLabel', { n: rowNumber }) }}
      </p>
    </td>
    <td class="block p-2 sm:table-cell">
      <label :for="`case-${index}-points`" class="text-xs text-muted sm:sr-only">{{
        $t('admin.problems.data.cases.columns.points')
      }}</label>
      <input
        v-if="row.type !== 'E'"
        :id="`case-${index}-points`"
        :value="row.points ?? ''"
        type="number"
        min="0"
        :class="ADMIN_INPUT_CLASS"
        @input="setOptionalNumber('points', ($event.target as HTMLInputElement).value)"
      />
      <label v-if="row.type === 'C'" class="mt-2 flex min-h-11 items-center gap-2 text-sm">
        <input v-model="row.isPretest" type="checkbox" class="size-5" />
        {{ $t('admin.problems.data.cases.pretest') }}
      </label>
    </td>
    <td class="block p-2 sm:table-cell">
      <details>
        <summary class="min-h-11 content-center font-semibold">
          {{ $t('admin.problems.data.cases.columns.options') }}
        </summary>
        <div class="mt-2 flex flex-col gap-2">
          <label :for="`case-${index}-generatorArgs`" class="text-sm">{{
            $t('admin.problems.data.cases.generatorArgs')
          }}</label>
          <input
            :id="`case-${index}-generatorArgs`"
            v-model="row.generatorArgs"
            :class="ADMIN_INPUT_CLASS"
            autocomplete="off"
          />
          <label :for="`case-${index}-checker`" class="text-sm">{{
            $t('admin.problems.data.cases.caseChecker')
          }}</label>
          <select :id="`case-${index}-checker`" v-model="row.checker" :class="ADMIN_INPUT_CLASS">
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
            :class="ADMIN_INPUT_CLASS"
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
            :class="ADMIN_INPUT_CLASS"
            @input="setOptionalNumber('outputPrefix', ($event.target as HTMLInputElement).value)"
          />
          <label :for="`case-${index}-outputLimit`" class="text-sm">{{
            $t('admin.problems.data.checker.outputLimit')
          }}</label>
          <input
            :id="`case-${index}-outputLimit`"
            :value="row.outputLimit ?? ''"
            type="number"
            min="0"
            :class="ADMIN_INPUT_CLASS"
            @input="setOptionalNumber('outputLimit', ($event.target as HTMLInputElement).value)"
          />
        </div>
      </details>
    </td>
    <td class="block p-2 sm:table-cell">
      <ul class="flex flex-col gap-1 text-xs text-negative">
        <li v-for="message in messages" :key="message">{{ message }}</li>
      </ul>
    </td>
  </tr>
</template>
