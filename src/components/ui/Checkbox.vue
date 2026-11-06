<script setup lang="ts">
import { Check } from 'lucide-vue-next';
import { computed, useId } from 'vue';
import { CHECKBOX_INPUT, CHOICE_ROW } from './choice-classes';

/**
 * A yes/no field of a form saved later (a switch is for settings that apply at once): the box, its label and an optional
 * one-line description, in one 44 px row on touch. Without `label` the box stands alone (a table cell, a bulk select) and
 * the caller names it with `aria-label`. `disabled` is `aria-disabled` with the muted pair: a click does nothing.
 */
defineOptions({ name: 'UiCheckbox', inheritAttrs: false });
const model = defineModel<boolean>({ required: true });
const props = withDefaults(
  defineProps<{ label?: string; description?: string; disabled?: boolean; inputId?: string }>(),
  { label: undefined, description: undefined, disabled: false, inputId: undefined },
);
const generatedId = useId();
const id = computed(() => props.inputId ?? generatedId);
const describedBy = computed(() => (props.description ? `${id.value}-desc` : undefined));
/** The native `disabled` would drop the box from the tab order and mute it by opacity; `aria-disabled` keeps both. */
const refuseWhenDisabled = (event: Event) => {
  if (props.disabled) event.preventDefault();
};
</script>

<template>
  <div :class="CHOICE_ROW">
    <span class="relative mt-0.5 inline-flex shrink-0 touch:mt-0">
      <input
        v-bind="$attrs"
        :id="id"
        v-model="model"
        type="checkbox"
        :class="CHECKBOX_INPUT"
        :aria-disabled="disabled ? 'true' : undefined"
        :aria-describedby="describedBy"
        @click="refuseWhenDisabled"
      />
      <Check
        aria-hidden="true"
        class="pointer-events-none absolute inset-0.5 hidden size-4 text-on-accent peer-checked:block"
      />
    </span>
    <label
      v-if="label"
      :for="id"
      class="flex min-w-0 flex-col"
      :class="{ 'cursor-pointer': !disabled }"
    >
      <span class="text-sm font-semibold" :class="{ 'text-muted': disabled }">{{ label }}</span>
      <span v-if="description" :id="`${id}-desc`" class="text-meta text-muted">{{
        description
      }}</span>
    </label>
    <slot />
  </div>
</template>
