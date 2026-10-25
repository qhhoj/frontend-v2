<script setup lang="ts">
import { checked } from '../../ui/use-row-selection';
import { ArrowDown, ArrowUp, X } from 'lucide-vue-next';
import { INPUT, iconButtonClass } from '../../ui/controls';
import { numberBoxValue } from '../../ui/form/number-box';
import type { ProblemRow } from './contest-problems';

/**
 * One problem of the contest order: its label, points, flags, and with `showLimits` its output prefix and cap, with
 * select, move and remove. Below `md` the row turns into a card: every cell shows its own caption.
 */
const row = defineModel<ProblemRow>({ required: true });
const props = defineProps<{
  label: string;
  issue?: string;
  position: number;
  count: number;
  isSelected: boolean;
  showLimits: boolean;
}>();
const emit = defineEmits<{
  move: [delta: -1 | 1];
  moveTo: [position: number];
  remove: [];
  select: [isOn: boolean];
}>();
/** A position typed out of range is clamped by the list; an empty or non-number box does nothing. */
function commitPosition(event: Event) {
  const input = event.target as HTMLInputElement;
  const typed = Number.parseInt(input.value, 10);
  if (Number.isInteger(typed) && typed !== props.position) emit('moveTo', typed);
  input.value = String(props.position);
}
const CELL = 'px-2 py-3 max-md:p-0';
const CAPTION = 'block text-xs text-muted md:hidden';
const ICON_BUTTON = iconButtonClass('ghost', 'sm');
</script>

<template>
  <tr
    class="border-t border-line align-top max-md:grid max-md:grid-cols-2 max-md:gap-3 max-md:py-4 max-sm:grid-cols-1"
  >
    <td :class="CELL" class="max-md:col-span-full">
      <div class="flex items-start gap-3">
        <input
          type="checkbox"
          class="mt-0.5 size-4 shrink-0 accent-accent"
          :checked="isSelected"
          :aria-label="$t('admin.contests.bulk.selectRow', { name: row.code })"
          @change="emit('select', checked($event))"
        />
        <span class="font-semibold">{{ label }}</span>
        <div class="min-w-0 md:hidden">
          <div class="font-semibold">{{ row.name }}</div>
          <div class="font-mono text-xs text-muted">{{ row.code }}</div>
        </div>
      </div>
    </td>
    <td :class="CELL" class="max-md:col-span-full">
      <div class="max-md:hidden">
        <div class="font-semibold">{{ row.name }}</div>
        <div data-testid="code" class="font-mono text-xs text-muted">{{ row.code }}</div>
      </div>
      <p v-if="issue" class="text-sm text-negative">{{ issue }}</p>
    </td>
    <td :class="CELL">
      <span :class="CAPTION">{{ $t('admin.contests.problems.columns.points') }}</span>
      <input
        v-model.number="row.points"
        type="number"
        min="0"
        :aria-label="$t('admin.contests.problems.pointsFor', { code: row.code })"
        :class="INPUT"
        class="md:w-24 md:min-w-20"
      />
    </td>
    <td :class="CELL">
      <label class="flex min-h-11 items-center gap-2 md:block md:min-h-0">
        <input
          v-model="row.partial"
          type="checkbox"
          class="size-4 accent-accent"
          :aria-label="$t('admin.contests.problems.partialFor', { code: row.code })"
        />
        <span class="text-sm md:hidden">{{ $t('admin.contests.problems.columns.partial') }}</span>
      </label>
    </td>
    <td :class="CELL">
      <label class="flex min-h-11 items-center gap-2 md:block md:min-h-0">
        <input
          v-model="row.isPretested"
          type="checkbox"
          class="size-4 accent-accent"
          :aria-label="$t('admin.contests.problems.pretestFor', { code: row.code })"
        />
        <span class="text-sm md:hidden">{{ $t('admin.contests.problems.columns.pretest') }}</span>
      </label>
    </td>
    <td v-if="showLimits" :class="CELL">
      <span :class="CAPTION">{{ $t('admin.contests.problems.columns.prefix') }}</span>
      <input
        :value="row.outputPrefix ?? ''"
        type="number"
        min="0"
        :placeholder="$t('admin.contests.problems.prefixDefault')"
        :aria-label="$t('admin.contests.problems.prefixFor', { code: row.code })"
        :class="INPUT"
        class="md:w-28 md:min-w-24"
        @input="row.outputPrefix = numberBoxValue($event)"
      />
    </td>
    <td v-if="showLimits" :class="CELL">
      <span :class="CAPTION">{{ $t('admin.contests.problems.columns.maxSubmissions') }}</span>
      <input
        :value="row.maxSubmissions ?? ''"
        type="number"
        min="1"
        :placeholder="$t('admin.contests.problems.maxNone')"
        :aria-label="$t('admin.contests.problems.maxFor', { code: row.code })"
        :class="INPUT"
        class="md:w-28 md:min-w-24"
        @input="row.maxSubmissions = numberBoxValue($event)"
      />
    </td>
    <td :class="CELL" class="max-md:col-span-full">
      <div class="flex items-center gap-1">
        <input
          :value="position"
          type="number"
          min="1"
          :max="count"
          :aria-label="$t('admin.contests.problems.positionFor', { code: row.code })"
          :class="INPUT"
          class="max-w-16 shrink-0"
          @change="commitPosition"
          @keydown.enter.prevent="commitPosition"
        />
        <button
          type="button"
          :class="ICON_BUTTON"
          :aria-label="$t('admin.contests.problems.moveUp', { code: row.code })"
          :disabled="position === 1"
          @click="emit('move', -1)"
        >
          <ArrowUp aria-hidden="true" class="size-4" />
        </button>
        <button
          type="button"
          :class="ICON_BUTTON"
          :aria-label="$t('admin.contests.problems.moveDown', { code: row.code })"
          :disabled="position === count"
          @click="emit('move', 1)"
        >
          <ArrowDown aria-hidden="true" class="size-4" />
        </button>
        <button
          type="button"
          :class="ICON_BUTTON"
          :aria-label="$t('admin.contests.problems.remove', { code: row.code })"
          @click="emit('remove')"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
      </div>
    </td>
  </tr>
</template>
