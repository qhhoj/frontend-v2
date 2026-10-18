<script setup lang="ts">
import { computed, useId } from 'vue';

export type SwitchSize = 'md' | 'lg';

/**
 * An on/off setting that applies at once; inside a form saved later, use a checkbox instead. A `role="switch"` button with
 * `aria-checked`, named by its visible `label` (clicking the label toggles too), or by `labelledby` when the page shows the
 * title elsewhere; give one of the two. `description` and the `#note` slot describe it. `md` is a 24 × 40 track, `lg` (a
 * settings row on a public page) 44 × 56; both reach 44 px on coarse pointers. Off: `surface-strong` track, `line-strong`
 * frame, muted thumb. On: accent track, `on-accent` thumb. `disabled` is `aria-disabled` with the muted pair, never opacity:
 * a click does nothing, and `#note` says why.
 */
const model = defineModel<boolean>({ required: true });
const props = withDefaults(
  defineProps<{
    label?: string;
    description?: string;
    /** The id of a title shown elsewhere on the page, instead of `label`. */
    labelledby?: string;
    disabled?: boolean;
    size?: SwitchSize;
  }>(),
  { label: undefined, description: undefined, labelledby: undefined, size: 'md' },
);
const slots = defineSlots<{ note?: () => unknown }>();
defineOptions({ name: 'UiSwitch' });
if (import.meta.env.DEV && !props.label && !props.labelledby)
  console.warn('[UiSwitch] give a `label` or a `labelledby`: the switch has no accessible name');
const labelId = useId();
const descriptionId = useId();
const noteId = useId();
const hasText = computed(() => Boolean(props.label || props.description || slots.note));
const describedBy = computed(
  () =>
    [props.description && descriptionId, slots.note && noteId].filter(Boolean).join(' ') ||
    undefined,
);

const SIZES: Record<SwitchSize, { track: string; thumb: string; on: string }> = {
  md: {
    track: 'h-6 w-10 before:-inset-2.5',
    thumb: 'ml-0.5 size-4.5',
    on: 'translate-x-4',
  },
  lg: { track: 'h-11 w-14', thumb: 'ml-1 size-8', on: 'translate-x-3.5' },
};
/** One colour pair per state, so a locked switch never depends on which variant Tailwind sorts last. */
const colours = computed(() => {
  if (props.disabled)
    return model.value
      ? { track: 'border-line bg-accent-soft', thumb: 'bg-line-strong' }
      : { track: 'border-line bg-surface', thumb: 'bg-line-strong' };
  return model.value
    ? { track: 'border-accent bg-accent', thumb: 'bg-on-accent' }
    : { track: 'border-line-strong bg-surface-strong', thumb: 'bg-muted' };
});
const toggle = () => {
  if (!props.disabled) model.value = !model.value;
};
</script>

<template>
  <div class="flex gap-3" :class="hasText ? 'items-start' : 'items-center'">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-disabled="disabled ? 'true' : undefined"
      :aria-labelledby="labelledby ?? labelId"
      :aria-describedby="describedBy"
      class="relative inline-flex shrink-0 items-center rounded-pill border transition-colors before:absolute aria-disabled:cursor-not-allowed"
      :class="[SIZES[size].track, colours.track, hasText && size === 'md' && 'mt-0.5']"
      @click="toggle"
    >
      <span
        aria-hidden="true"
        class="rounded-full transition-transform"
        :class="[SIZES[size].thumb, colours.thumb, model && SIZES[size].on]"
      />
    </button>
    <div v-if="hasText" class="flex min-w-0 flex-col">
      <span
        v-if="label"
        :id="labelId"
        class="text-sm font-semibold"
        :class="!disabled && 'cursor-pointer'"
        @click="toggle"
        >{{ label }}</span
      >
      <span v-if="description" :id="descriptionId" class="text-sm text-muted">{{
        description
      }}</span>
      <span v-if="slots.note" :id="noteId" class="text-meta text-muted"><slot name="note" /></span>
    </div>
  </div>
</template>
