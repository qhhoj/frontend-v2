<script setup lang="ts" generic="Value extends string | number">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import type { RouteLocationRaw } from 'vue-router';
import { RouterLink } from 'vue-router';

export interface SegmentOption<V extends string | number = string> {
  value: V;
  label: string;
  /** A link segment (the choice lives in the URL, `aria-current="page"`); otherwise a toggle button (`aria-pressed`). */
  to?: RouteLocationRaw;
  /** A count chip after the label; hidden at 0. */
  count?: number;
  countLabel?: string;
  countTestid?: string;
  /** A red dot after the label, read as this text: the choice holds something to fix (a field error). */
  alertLabel?: string;
  testid?: string;
}

/**
 * One choice out of a few, as pills inside one pill frame. `md` fills its width with equal segments (settings);
 * `sm` is the admin chip density and wraps on a narrow phone instead of being clipped, the current segment scrolled into
 * view when the row still overflows. Links make it a `nav`; buttons a `group` of `aria-pressed` toggles.
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
  sm: 'flex max-w-full flex-wrap gap-0.5 self-start overflow-x-auto rounded-[1.125rem] border border-line-strong bg-surface-solid p-0.5',
};
const SEGMENT = {
  md: 'min-h-11 flex-1 px-2 leading-tight',
  sm: 'inline-flex min-h-7 shrink-0 items-center gap-1.5 px-3 font-semibold whitespace-nowrap pointer-coarse:min-h-9',
};
/** One active look for every tab set: accent-soft fill, accent border. Disabled keeps full-contrast text, no opacity. */
const ACTIVE =
  'border-accent bg-accent-soft font-semibold text-accent-soft-text disabled:border-line-strong disabled:bg-surface-hover disabled:text-content';
const IDLE =
  'border-transparent text-muted hover:text-content disabled:border-line disabled:bg-surface-strong';
const COUNT = 'rounded-pill bg-surface-strong px-1.5 font-mono text-xs tabular-nums';
const ALERT = 'size-2 shrink-0 rounded-full bg-negative';
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
      v-for="option in options"
      :key="option.value"
      v-bind="stateOf(option)"
      :data-testid="option.testid"
      class="rounded-pill border text-sm disabled:cursor-not-allowed"
      :class="[SEGMENT[size], option.value === modelValue ? ACTIVE : IDLE]"
      @click="option.to ? undefined : emit('update:modelValue', option.value)"
    >
      {{ option.label }}
      <span v-if="option.count" :class="COUNT">
        <span
          :data-testid="option.countTestid"
          :aria-hidden="option.countLabel ? 'true' : undefined"
          >{{ option.count }}</span
        >
        <span v-if="option.countLabel" class="sr-only">{{ option.countLabel }}</span>
      </span>
      <span v-if="option.alertLabel" :data-testid="`${option.testid}-alert`" :class="ALERT">
        <span class="sr-only">{{ option.alertLabel }}</span>
      </span>
    </component>
  </component>
</template>
