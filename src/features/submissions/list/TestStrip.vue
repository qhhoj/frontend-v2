<script setup lang="ts">
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useLocaleStore } from '@/stores/locale.store';
import { LETTERED_CELLS_MAX, cellColourVar, stripCells, stripCounts } from './test-strip';
import type { StripCell, TestSummary } from './test-strip';

/**
 * One cell per test (or subtask) in judging order, coloured by verdict, with a text line under it ("18/20 test đúng · 2 WA")
 * so colour is never the only cue: failed cells also carry their verdict letter (or a hatch once there are too many to letter).
 * Hovering a cell, or focusing the strip and moving with the arrow keys, names that test in the text line.
 */
const props = defineProps<{ summary: TestSummary; isGrading: boolean }>();
const locale = useLocaleStore();
const cells = computed(() => stripCells(props.summary));
const counts = computed(() => stripCounts(props.summary));
const isLettered = computed(() => cells.value.length <= LETTERED_CELLS_MAX);
const active = ref<number | null>(null);
const isFocused = ref(false);

const caption = computed(() => {
  const { passed, outOf, failures, more } = counts.value;
  const key =
    props.summary.unit === 'batch' ? 'submissions.strip.passedBatch' : 'submissions.strip.passed';
  return [
    translate(key, { passed, outOf }),
    ...failures.map(([code, count]) =>
      translate('submissions.strip.failure', { code, count: formatNumber(count, locale.locale) }),
    ),
    ...(more
      ? [translate('submissions.strip.more', { count: formatNumber(more, locale.locale) })]
      : []),
    ...(props.isGrading ? [translate('submissions.strip.grading')] : []),
  ].join(' · ');
});
const cellLabel = (cell: StripCell) =>
  translate(
    props.summary.unit === 'batch' ? 'submissions.strip.cellBatch' : 'submissions.strip.cell',
    {
      number: cell.number,
      verdict:
        cell.status === null
          ? translate('submissions.strip.pending')
          : `${translate(`verdicts.${cell.status}`)} (${cell.status})`,
    },
  );
const line = computed(() => {
  const cell = active.value === null ? undefined : cells.value[active.value];
  return cell ? cellLabel(cell) : caption.value;
});

const cellStyle = (cell: StripCell) => {
  if (cell.status === null) return {};
  const fill = `var(${cellColourVar(cell.status)})`;
  if (cell.status === 'AC' || isLettered.value) return { background: fill };
  return {
    background: `repeating-linear-gradient(135deg, ${fill} 0 3px, var(--qh-surface-solid) 3px 4px)`,
  };
};

const STEP: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
function move(event: KeyboardEvent) {
  const last = cells.value.length - 1;
  const target =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? last
        : (active.value ?? -1) + (STEP[event.key] ?? 0);
  if (!(event.key in STEP) && event.key !== 'Home' && event.key !== 'End') return;
  event.preventDefault();
  active.value = Math.min(last, Math.max(0, target));
}
</script>

<template>
  <div class="mt-2 min-w-0" data-testid="test-strip">
    <div
      role="img"
      tabindex="0"
      :aria-label="caption"
      :aria-description="$t('submissions.strip.hint')"
      class="flex h-4 rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      :class="isLettered ? 'gap-px' : 'gap-0'"
      @keydown="move"
      @focus="isFocused = true"
      @blur="((isFocused = false), (active = null))"
      @mouseleave="active = isFocused ? active : null"
    >
      <span
        v-for="(cell, index) in cells"
        :key="cell.number"
        aria-hidden="true"
        :title="cellLabel(cell)"
        :style="cellStyle(cell)"
        class="flex min-w-0 flex-1 items-center justify-center font-mono text-tiny leading-none font-bold text-on-verdict-solid"
        :class="[
          isLettered && 'rounded-[2px]',
          cell.status === null && 'border border-line-strong',
          active === index && 'outline-2 outline-offset-1 outline-content',
        ]"
        @mouseenter="active = index"
        >{{ isLettered && cell.status && cell.status !== 'AC' ? cell.status[0] : '' }}</span
      >
    </div>
    <p
      class="mt-1 line-clamp-2 font-mono text-xs text-muted"
      :aria-live="isFocused ? 'polite' : 'off'"
      :aria-hidden="!isFocused"
    >
      {{ line }}
    </p>
  </div>
</template>
