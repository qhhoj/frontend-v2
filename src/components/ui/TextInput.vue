<script setup lang="ts">
import { CONTROL_FRAME, FIELD_FRAME, FIELD_INPUT, useFieldControl } from './FormField.control';
import { useSplitAttrs } from './split-attrs';

/**
 * A text input: 40 px (44 on touch), the control border and radius of a button, 15 px text on the surface (`FormField.control.ts`). Inside a `FormField` it takes the field's id and
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
</script>

<template>
  <input
    v-if="!$slots.prefix && !$slots.suffix"
    v-bind="$attrs"
    :id="field?.id ?? ($attrs.id as string | undefined)"
    v-model="model"
    :aria-describedby="
      field?.describedBy ??
      ($attrs['aria-describedby' as keyof typeof $attrs] as string | undefined)
    "
    :aria-invalid="
      field?.invalid ?? ($attrs['aria-invalid' as keyof typeof $attrs] as 'true' | undefined)
    "
    :class="`${CONTROL_FRAME} h-(--qh-control)`"
  />
  <div v-else v-bind="frame" :class="FIELD_FRAME" @click="focusInput">
    <span v-if="$slots.prefix" class="flex shrink-0 items-center text-muted"
      ><slot name="prefix"
    /></span>
    <input
      v-bind="input"
      :id="field?.id ?? ($attrs.id as string | undefined)"
      v-model="model"
      :aria-describedby="
        field?.describedBy ??
        ($attrs['aria-describedby' as keyof typeof $attrs] as string | undefined)
      "
      :aria-invalid="
        field?.invalid ?? ($attrs['aria-invalid' as keyof typeof $attrs] as 'true' | undefined)
      "
      :class="FIELD_INPUT"
    />
    <span v-if="$slots.suffix" class="flex shrink-0 items-center text-muted"
      ><slot name="suffix"
    /></span>
  </div>
</template>
