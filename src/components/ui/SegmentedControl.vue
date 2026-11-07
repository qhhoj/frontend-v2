<script setup lang="ts" generic="Value extends string | number">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { RouterLink } from 'vue-router';
import Chip from './Chip.vue';

export interface SegmentOption<V extends string | number = string> {
  value: V;
  label: string;
  /** A link segment (the choice lives in the URL, `aria-current="page"`); otherwise a toggle button (`aria-pressed`). */
  to?: RouteLocationRaw;
  /** A count chip after the label; hidden at 0. */
  count?: number;
  countLabel?: string;
  countTestid?: string;
  /** A short word in a small chip after the label ("Chưa có"): a state of the choice, not a number. */
  badge?: string;
  /**
   * A dot after the label, read as its `label`: `accent` says the choice holds unsaved edits, `danger` something to fix.
   * `alertLabel` is the danger dot's shorthand.
   */
  dot?: SegmentDot;
  /** A red dot after the label, read as this text: the choice holds something to fix (a field error). */
  alertLabel?: string;
  testid?: string;
}

export interface SegmentDot {
  label: string;
  tone: 'accent' | 'danger';
}

/**
 * One choice out of a few, as pills inside one pill frame. `md` fills its width with equal segments (settings);
 * `sm` is the admin chip density (a 44 px segment on a coarse pointer) and wraps on a narrow phone instead of being clipped, the
 * current segment scrolled into view when the row still overflows. Links make it a `nav`; buttons a `group` of `aria-pressed` toggles.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    options: ReadonlyArray<SegmentOption<Value>>;
    modelValue: Value | null;
    size?: 'md' | 'sm';
    disabled?: boolean;
  }>(),
  { size: 'md' },
);
const emit = defineEmits<{ 'update:modelValue': [value: Value] }>();
const isNav = computed(() => props.options.some((option) => option.to));
const frame = ref<HTMLElement | null>(null);

function revealCurrent() {
  const box = frame.value;
  const segment = box?.querySelector<HTMLElement>('[aria-current="page"], [aria-pressed="true"]');
  if (!box || !segment || box.scrollWidth <= box.clientWidth) return;
  box.scrollLeft = segment.offsetLeft - (box.clientWidth - segment.offsetWidth) / 2;
}
onMounted(revealCurrent);
watch(
  () => props.modelValue,
  () => void nextTick(revealCurrent),
);

function stateOf(option: SegmentOption<Value>) {
  const isCurrent = option.value === props.modelValue;
  if (option.to) return { to: option.to, 'aria-current': isCurrent ? 'page' : undefined };
  return { type: 'button', disabled: props.disabled, 'aria-pressed': isCurrent };
}

const FRAME = {
  md: 'flex gap-1 rounded-pill bg-surface-strong p-1',
  sm: 'flex max-w-full flex-wrap gap-0.5 self-start overflow-x-auto rounded-row border border-line-strong bg-surface-solid p-0.5',
};
const SEGMENT = {
  md: 'min-h-11 flex-1 px-2 leading-tight',
  sm: 'inline-flex min-h-7 shrink-0 items-center gap-1.5 px-3 font-semibold whitespace-nowrap touch:min-h-11',
};
/** One active look for every tab set: accent-soft fill, accent border. Disabled keeps full-contrast text, no opacity. */
const ACTIVE =
  'border-accent bg-accent-soft font-semibold text-accent-soft-text disabled:border-line-strong disabled:bg-surface-hover disabled:text-content';
const IDLE =
  'border-transparent text-muted hover:text-content disabled:border-line disabled:bg-surface-strong';
const DOT_TONE = { accent: 'bg-accent', danger: 'bg-negative' } as const;
const DOT = 'inline-block size-2 shrink-0 rounded-full align-middle';

/** The option's dot: its own, else the red one `alertLabel` names. */
function dotOf(option: SegmentOption<Value>): SegmentDot | undefined {
  if (option.dot) return option.dot;
  return option.alertLabel ? { label: option.alertLabel, tone: 'danger' } : undefined;
}
const segments = computed(() => props.options.map((option) => ({ option, dot: dotOf(option) })));
</script>

<template>
  <component
    :is="isNav ? 'nav' : 'div'"
    ref="frame"
    :role="isNav ? undefined : 'group'"
    :aria-label="label"
    :class="FRAME[size]"
  >
    <component
      :is="option.to ? RouterLink : 'button'"
      v-for="{ option, dot } in segments"
      :key="option.value"
      v-bind="stateOf(option)"
      :data-testid="option.testid"
      class="rounded-pill border text-sm disabled:cursor-not-allowed"
      :class="[SEGMENT[size], option.value === modelValue ? ACTIVE : IDLE]"
      @click="option.to ? undefined : emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <Chip v-if="option.count" size="sm" class="font-mono tabular-nums">
        <span
          :data-testid="option.countTestid"
          :aria-hidden="option.countLabel ? 'true' : undefined"
          >{{ option.count }}</span
        >
        <span v-if="option.countLabel" class="sr-only">{{ option.countLabel }}</span>
      </Chip>
      <Chip v-if="option.badge" size="sm">{{ option.badge }}</Chip>
      <span
        v-if="dot"
        :data-testid="`${option.testid}-${dot.tone === 'danger' ? 'alert' : 'dot'}`"
        :class="[DOT, DOT_TONE[dot.tone]]"
      >
        <span class="sr-only">{{ dot.label }}</span>
      </span>
    </component>
  </component>
</template>
