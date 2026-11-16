<script setup lang="ts">
import { CONTROL_FRAME, useFieldControl } from './FormField.control';
import { useSplitAttrs } from './split-attrs';

/**
 * A text input, a 36 px pill (44 on touch), 15 px text on the strong surface, no line. Inside a `FormField` it takes the field's id and
 * description. `#prefix` and `#suffix` sit inside the frame (a unit like "MB", a slug start like "qhhoj.com/", an icon); a tap
 * on them focuses the input. Extra attributes (`type`, `min`, `inputmode`) go to the input; `class` too, or to the frame when there is a prefix or suffix.
 */
defineOptions({ inheritAttrs: false });
const model = defineModel<string | number>();
const field = useFieldControl();
const { frame, input } = useSplitAttrs();
/** A tap on the frame (a prefix, the padding) focuses the input; the frame is a `div`, so a button in `#suffix` does not join the input's accessible name. */
function focusInput(event: MouseEvent) {
  const frameEl = event.currentTarget as HTMLElement;
  if (event.target === frameEl || !(event.target as HTMLElement).closest('button'))
    frameEl.querySelector('input')?.focus();
}
const FRAMED =
  'edge-high flex h-(--qh-control) items-center gap-2 rounded-control bg-surface-strong px-(--qh-control-px-sm) text-body text-content has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus has-aria-invalid:bg-negative-bg has-aria-invalid:inset-ring has-aria-invalid:inset-ring-negative has-disabled:cursor-not-allowed has-disabled:text-muted';
</script>

<template>
  <input
    v-if="!$slots.prefix && !$slots.suffix"
    v-bind="$attrs"
    :id="field?.id"
    v-model="model"
    :aria-describedby="
      field?.describedBy ??
      ($attrs['aria-describedby' as keyof typeof $attrs] as string | undefined)
    "
    :aria-invalid="
      field?.invalid ?? ($attrs['aria-invalid' as keyof typeof $attrs] as 'true' | undefined)
    "
    :class="`${CONTROL_FRAME} h-(--qh-control) rounded-control`"
  />
  <div v-else v-bind="frame" :class="FRAMED" @click="focusInput">
    <span v-if="$slots.prefix" class="flex shrink-0 items-center text-muted"
      ><slot name="prefix"
    /></span>
    <input
      v-bind="input"
      :id="field?.id"
      v-model="model"
      :aria-describedby="
        field?.describedBy ??
        ($attrs['aria-describedby' as keyof typeof $attrs] as string | undefined)
      "
      :aria-invalid="
        field?.invalid ?? ($attrs['aria-invalid' as keyof typeof $attrs] as 'true' | undefined)
      "
      class="h-full min-w-0 flex-1 bg-transparent text-body outline-none placeholder:text-muted"
    />
    <span v-if="$slots.suffix" class="flex shrink-0 items-center text-muted"
      ><slot name="suffix"
    /></span>
  </div>
</template>
