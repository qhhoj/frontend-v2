<script setup lang="ts">
import { ArrowDown, ArrowUp, X } from 'lucide-vue-next';
import { ADMIN_INPUT_CLASS } from '../../ui/classes';
import { nullableNumber, textOf } from '../general/input-values';
import type { ProblemRow } from './contest-problems';

/** One problem of the contest order: its label, points, flags, output prefix and cap, with move and remove. */
const row = defineModel<ProblemRow>({ required: true });
defineProps<{ label: string; issue?: string; isFirst: boolean; isLast: boolean }>();
const emit = defineEmits<{ move: [delta: -1 | 1]; remove: [] }>();
</script>

<template>
  <tr class="border-t border-line align-top">
    <td class="px-2 py-3 font-semibold">{{ label }}</td>
    <td class="px-2 py-3">
      <div class="font-semibold">{{ row.name }}</div>
      <div data-testid="code" class="font-mono text-xs text-muted">{{ row.code }}</div>
      <p v-if="issue" class="text-sm text-negative">{{ issue }}</p>
    </td>
    <td class="px-2 py-3">
      <input
        v-model.number="row.points"
        type="number"
        min="0"
        :aria-label="$t('admin.contests.problems.pointsFor', { code: row.code })"
        :class="ADMIN_INPUT_CLASS"
        class="w-24"
      />
    </td>
    <td class="px-2 py-3">
      <input
        v-model="row.partial"
        type="checkbox"
        class="size-5"
        :aria-label="$t('admin.contests.problems.partialFor', { code: row.code })"
      />
    </td>
    <td class="px-2 py-3">
      <input
        v-model="row.isPretested"
        type="checkbox"
        class="size-5"
        :aria-label="$t('admin.contests.problems.pretestFor', { code: row.code })"
      />
    </td>
    <td class="px-2 py-3">
      <input
        :value="row.outputPrefix ?? ''"
        type="number"
        min="0"
        :placeholder="$t('admin.contests.problems.prefixDefault')"
        :aria-label="$t('admin.contests.problems.prefixFor', { code: row.code })"
        :class="ADMIN_INPUT_CLASS"
        class="w-28"
        @input="row.outputPrefix = nullableNumber(textOf($event))"
      />
    </td>
    <td class="px-2 py-3">
      <input
        :value="row.maxSubmissions ?? ''"
        type="number"
        min="1"
        :placeholder="$t('admin.contests.problems.maxNone')"
        :aria-label="$t('admin.contests.problems.maxFor', { code: row.code })"
        :class="ADMIN_INPUT_CLASS"
        class="w-28"
        @input="row.maxSubmissions = nullableNumber(textOf($event))"
      />
    </td>
    <td class="px-2 py-3">
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover disabled:cursor-not-allowed"
          :aria-label="$t('admin.contests.problems.moveUp', { code: row.code })"
          :disabled="isFirst"
          @click="emit('move', -1)"
        >
          <ArrowUp aria-hidden="true" class="size-4" />
        </button>
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover disabled:cursor-not-allowed"
          :aria-label="$t('admin.contests.problems.moveDown', { code: row.code })"
          :disabled="isLast"
          @click="emit('move', 1)"
        >
          <ArrowDown aria-hidden="true" class="size-4" />
        </button>
        <button
          type="button"
          class="inline-flex size-11 items-center justify-center rounded-full hover:bg-surface-hover"
          :aria-label="$t('admin.contests.problems.remove', { code: row.code })"
          @click="emit('remove')"
        >
          <X aria-hidden="true" class="size-4" />
        </button>
      </div>
    </td>
  </tr>
</template>
