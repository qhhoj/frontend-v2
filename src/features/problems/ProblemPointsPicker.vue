<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import { computed, ref, watch } from 'vue';
import { PROBLEM_LIMITS } from '@/features/admin/problems/general/problem-form';
import { translate } from '@/i18n';
import { toolbarControlClass } from '@/components/toolbar-classes';
import Popover from '@/components/ui/Popover.vue';

const props = defineProps<{ min: number | null; max: number | null }>();
const emit = defineEmits<{
  change: [range: { pointsMin: number | null; pointsMax: number | null }];
}>();

/** The slider spans the points a problem can have; a handle at its end of the track means "no bound". */
const SLIDER = { ...PROBLEM_LIMITS.points, step: 100 } as const;
const popover = ref<InstanceType<typeof Popover>>();
const open = ref(false);
/** The bounds follow the pointer while dragging; the filter changes once, on release. null: no bound. */
const draftMin = ref<number | null>(null);
const draftMax = ref<number | null>(null);
watch(
  () => [props.min, props.max] as const,
  ([min, max]) => {
    draftMin.value = min;
    draftMax.value = max;
  },
  { immediate: true },
);
const low = computed(() => draftMin.value ?? SLIDER.min);
const high = computed(() => draftMax.value ?? SLIDER.max);
const active = computed(() => draftMin.value !== null || draftMax.value !== null);
const label = computed(() =>
  active.value
    ? translate('problems.pointsRange', {
        min: draftMin.value ?? '…',
        max: draftMax.value ?? '…',
      })
    : translate('problems.pointsAny'),
);
const percent = (value: number) => ((value - SLIDER.min) / (SLIDER.max - SLIDER.min)) * 100;
const fill = computed(() => ({
  '--fill-from': `${percent(low.value)}%`,
  '--fill-to': `${percent(high.value)}%`,
}));
/** Both handles at the right end: the minimum must be on top, or it could never move. */
const minOnTop = computed(() => low.value >= high.value - SLIDER.step);

const numberOf = (event: Event) => {
  const text = (event.target as HTMLInputElement).value;
  return text === '' ? null : Math.trunc(Number(text));
};
/** A minimum above the maximum (or the reverse) swaps the two, so the range is never empty. */
function setRange(pointsMin: number | null, pointsMax: number | null) {
  const swapped = pointsMin !== null && pointsMax !== null && pointsMin > pointsMax;
  emit(
    'change',
    swapped ? { pointsMin: pointsMax, pointsMax: pointsMin } : { pointsMin, pointsMax },
  );
}
const setMin = (value: number | null) => setRange(value, props.max);
const setMax = (value: number | null) => setRange(props.min, value);
/** A handle cannot pass the other one; the input is put back where the value is, so the thumb never drifts. A handle at its end of the track means "no bound". */
function slide(event: Event, edge: 'low' | 'high') {
  const input = event.target as HTMLInputElement;
  const value = Number(input.value);
  const kept = edge === 'low' ? Math.min(value, high.value) : Math.max(value, low.value);
  if (kept !== value) input.value = String(kept);
  if (edge === 'low') draftMin.value = kept === SLIDER.min ? null : kept;
  else draftMax.value = kept === SLIDER.max ? null : kept;
}
const commit = () => setRange(draftMin.value, draftMax.value);
</script>

<template>
  <button
    type="button"
    aria-haspopup="dialog"
    :aria-expanded="open"
    :aria-label="`${$t('problems.pointsFilter')}: ${label}`"
    :class="toolbarControlClass(active)"
    @click="popover?.toggle($event)"
  >
    {{ label }}
    <ChevronDown class="size-4" aria-hidden="true" />
  </button>
  <Popover
    ref="popover"
    :label="$t('problems.pointsFilter')"
    @show="open = true"
    @hide="open = false"
  >
    <div class="flex w-72 flex-col gap-3">
      <div class="flex gap-3">
        <label class="flex flex-1 flex-col gap-1 text-sm">
          {{ $t('problems.pointsMin') }}
          <input
            name="pointsMin"
            type="number"
            inputmode="numeric"
            :min="SLIDER.min"
            :max="SLIDER.max"
            :step="SLIDER.step"
            :value="min ?? ''"
            class="h-11 w-full rounded-row border border-line-control bg-surface-strong px-3 text-content"
            @change="setMin(numberOf($event))"
          />
        </label>
        <label class="flex flex-1 flex-col gap-1 text-sm">
          {{ $t('problems.pointsMax') }}
          <input
            name="pointsMax"
            type="number"
            inputmode="numeric"
            :min="SLIDER.min"
            :max="SLIDER.max"
            :step="SLIDER.step"
            :value="max ?? ''"
            class="h-11 w-full rounded-row border border-line-control bg-surface-strong px-3 text-content"
            @change="setMax(numberOf($event))"
          />
        </label>
      </div>
      <div class="points-slider" data-testid="points-slider" :style="fill">
        <input
          type="range"
          name="pointsMinSlider"
          :class="{ 'is-top': minOnTop }"
          :min="SLIDER.min"
          :max="SLIDER.max"
          :step="SLIDER.step"
          :value="low"
          :aria-label="$t('problems.pointsMin')"
          @input="slide($event, 'low')"
          @change="commit"
        />
        <input
          type="range"
          name="pointsMaxSlider"
          :min="SLIDER.min"
          :max="SLIDER.max"
          :step="SLIDER.step"
          :value="high"
          :aria-label="$t('problems.pointsMax')"
          @input="slide($event, 'high')"
          @change="commit"
        />
      </div>
      <p
        class="flex justify-between text-caption leading-4 text-muted tabular-nums"
        aria-hidden="true"
      >
        <span>{{ SLIDER.min }}</span
        ><span>{{ SLIDER.max }}</span>
      </p>
    </div>
  </Popover>
</template>

<style scoped>
/* Two range inputs stacked on one track: the track ignores the pointer, only the thumbs take it. */
.points-slider {
  position: relative;
  height: 2rem;
}
/* The chosen range is the filled part of the track. */
.points-slider::before {
  content: '';
  position: absolute;
  top: calc(50% - 2px);
  left: var(--fill-from);
  right: calc(100% - var(--fill-to));
  height: 4px;
  border-radius: 2px;
  background: var(--qh-accent);
  pointer-events: none;
  z-index: 1;
}
.points-slider input.is-top {
  z-index: 3;
}
.points-slider input {
  position: absolute;
  z-index: 2;
  inset: 0;
  width: 100%;
  margin: 0;
  pointer-events: none;
  appearance: none;
  background: transparent;
  accent-color: var(--qh-accent);
}
.points-slider input::-webkit-slider-runnable-track {
  height: 4px;
  border-radius: 2px;
  background: var(--qh-line-strong);
}
.points-slider input::-moz-range-track {
  height: 4px;
  border-radius: 2px;
  background: var(--qh-line-strong);
}
.points-slider input::-webkit-slider-thumb {
  pointer-events: auto;
  appearance: none;
  width: 20px;
  height: 20px;
  margin-top: -8px;
  border-radius: 50%;
  border: 2px solid var(--qh-surface-solid);
  background: var(--qh-accent);
  cursor: pointer;
}
.points-slider input::-moz-range-thumb {
  pointer-events: auto;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid var(--qh-surface-solid);
  background: var(--qh-accent);
  cursor: pointer;
}
</style>
