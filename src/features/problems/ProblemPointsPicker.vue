<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next';
import Popover from 'primevue/popover';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { toolbarControlClass } from './toolbar-classes';

const props = defineProps<{ min: number | null; max: number | null }>();
const emit = defineEmits<{
  change: [range: { pointsMin: number | null; pointsMax: number | null }];
}>();

const SLIDER = { min: 0, max: 4000, step: 100 } as const;
const popover = ref<InstanceType<typeof Popover>>();
const open = ref(false);
const active = computed(() => props.min !== null || props.max !== null);
const label = computed(() =>
  active.value
    ? translate('problems.pointsRange', { min: props.min ?? '…', max: props.max ?? '…' })
    : translate('problems.pointsAny'),
);
const low = computed(() => props.min ?? SLIDER.min);
const high = computed(() => props.max ?? SLIDER.max);

const numberOf = (event: Event) => {
  const text = (event.target as HTMLInputElement).value;
  return text === '' ? null : Math.trunc(Number(text));
};
const setMin = (value: number | null) => emit('change', { pointsMin: value, pointsMax: props.max });
const setMax = (value: number | null) => emit('change', { pointsMin: props.min, pointsMax: value });
/** A handle resting on its end of the track means "no bound". */
const slideMin = (event: Event) => {
  const value = Math.min(numberOf(event) ?? SLIDER.min, high.value);
  setMin(value <= SLIDER.min ? null : value);
};
const slideMax = (event: Event) => {
  const value = Math.max(numberOf(event) ?? SLIDER.max, low.value);
  setMax(value >= SLIDER.max ? null : value);
};
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
    :pt="{ root: { 'aria-label': $t('problems.pointsFilter') } }"
    @show="open = true"
    @hide="open = false"
  >
    <div class="flex w-72 flex-col gap-3">
      <div class="flex gap-3">
        <label class="flex flex-1 flex-col gap-1 text-sm">
          {{ $t('problems.pointsMin') }}
          <input
            name="pointsMin"
            autofocus
            type="number"
            inputmode="numeric"
            :value="min ?? ''"
            class="h-11 w-full rounded-row border border-line bg-surface-strong px-3 text-content"
            @change="setMin(numberOf($event))"
          />
        </label>
        <label class="flex flex-1 flex-col gap-1 text-sm">
          {{ $t('problems.pointsMax') }}
          <input
            name="pointsMax"
            type="number"
            inputmode="numeric"
            :value="max ?? ''"
            class="h-11 w-full rounded-row border border-line bg-surface-strong px-3 text-content"
            @change="setMax(numberOf($event))"
          />
        </label>
      </div>
      <div class="points-slider" data-testid="points-slider">
        <input
          type="range"
          name="pointsMinSlider"
          :min="SLIDER.min"
          :max="SLIDER.max"
          :step="SLIDER.step"
          :value="low"
          :aria-label="$t('problems.pointsMin')"
          @change="slideMin"
        />
        <input
          type="range"
          name="pointsMaxSlider"
          :min="SLIDER.min"
          :max="SLIDER.max"
          :step="SLIDER.step"
          :value="high"
          :aria-label="$t('problems.pointsMax')"
          @change="slideMax"
        />
      </div>
    </div>
  </Popover>
</template>

<style scoped>
/* Two range inputs stacked on one track: the track ignores the pointer, only the thumbs take it. */
.points-slider {
  position: relative;
  height: 2rem;
}
.points-slider input {
  position: absolute;
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
