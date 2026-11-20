<script setup lang="ts" generic="Value extends string | number">
import { computed } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { RouterLink } from 'vue-router';
import Chip from './Chip.vue';
import StatusMark from './StatusMark.vue';
import { TOGGLE_BASE, TOGGLE_OFF, TOGGLE_ON } from './button-classes';

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
   * A `StatusMark` after the label, read as its `label`: `accent` (a dot) says the choice holds unsaved edits, `danger`
   * (an alert icon) something to fix. `alertLabel` is the danger mark's shorthand.
   */
  dot?: SegmentDot;
  /** The danger mark after the label, read as this text: the choice holds something to fix (a field error). */
  alertLabel?: string;
  testid?: string;
}

export interface SegmentDot {
  label: string;
  tone: 'accent' | 'danger';
}

/**
 * One choice out of two to four views or filters ("Sơn mài" controls): a row of filter toggles, 32 px rounded rectangles 8 px apart;
 * the chosen one takes the "on" look (soft brand ground, brand border, brand text). There is no track and no sliding thumb.
 * `md` fills its width with equal toggles (settings); `sm` keeps each toggle as wide as its label and wraps on a narrow phone.
 * Links make it a `nav`; buttons a `group` of `aria-pressed` toggles. A toggle is 44 px tall on touch.
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
function stateOf(option: SegmentOption<Value>) {
  const isCurrent = option.value === props.modelValue;
  if (option.to) return { to: option.to, 'aria-current': isCurrent ? 'page' : undefined };
  return { type: 'button', disabled: props.disabled, 'aria-pressed': isCurrent };
}

const FRAME = { md: 'flex max-w-full gap-2', sm: 'flex max-w-full flex-wrap gap-2 self-start' };
const SEGMENT = { md: 'flex-1 justify-center', sm: '' };
const DISABLED = 'disabled:cursor-not-allowed disabled:opacity-(--qh-opacity-disabled)';
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
      data-segment
      :class="[
        TOGGLE_BASE,
        SEGMENT[size],
        DISABLED,
        option.value === modelValue ? TOGGLE_ON : TOGGLE_OFF,
        !disabled && 'cursor-pointer',
      ]"
      @click="option.to ? undefined : emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span v-if="option.count" class="font-mono text-kbd tabular-nums">
        <span
          :data-testid="option.countTestid"
          :aria-hidden="option.countLabel ? 'true' : undefined"
          >{{ option.count }}</span
        >
        <span v-if="option.countLabel" class="sr-only">{{ option.countLabel }}</span>
      </span>
      <Chip v-if="option.badge">{{ option.badge }}</Chip>
      <StatusMark
        v-if="dot"
        :data-testid="`${option.testid}-${dot.tone === 'danger' ? 'alert' : 'dot'}`"
        :tone="dot.tone"
        :label="dot.label"
      />
    </component>
  </component>
</template>
