<script setup lang="ts">
import { useId } from 'vue';

/**
 * An on/off setting that applies at once; inside a form saved later, use a checkbox instead. A `role="switch"` button with
 * `aria-checked`, named by its visible `label`, or by `labelledby` when the page shows the title elsewhere. The track is
 * 24 × 40 with a 44 px hit area on coarse pointers. Off: `surface-strong` track, `line-strong` frame, muted thumb. On: accent
 * track, `on-accent` thumb. `disabled` is `aria-disabled` with the muted pair (never opacity): a click does nothing, and the
 * `#note` slot (under the description) says why.
 */
const model = defineModel<boolean>({ required: true });
const props = defineProps<{
  label?: string;
  description?: string;
  /** The id of a title shown elsewhere on the page, instead of `label`. */
  labelledby?: string;
  disabled?: boolean;
}>();
defineSlots<{ note?: () => unknown }>();
defineOptions({ name: 'UiSwitch' });
const labelId = useId();
const noteId = useId();
const toggle = () => {
  if (!props.disabled) model.value = !model.value;
};
</script>

<template>
  <div class="flex items-start gap-3">
    <button
      type="button"
      role="switch"
      :aria-checked="model"
      :aria-disabled="disabled ? 'true' : undefined"
      :aria-labelledby="labelledby ?? labelId"
      :aria-describedby="$slots.note ? noteId : undefined"
      class="group relative mt-0.5 inline-flex h-6 w-10 shrink-0 items-center rounded-pill border border-line-strong bg-surface-strong transition-colors duration-(--qh-duration-fast) before:absolute before:-inset-1 aria-checked:border-accent aria-checked:bg-accent aria-disabled:cursor-not-allowed aria-disabled:border-line aria-disabled:aria-checked:bg-accent-soft pointer-coarse:before:-inset-2.5"
      @click="toggle"
    >
      <span
        aria-hidden="true"
        class="ml-0.5 size-4.5 rounded-full bg-muted transition-transform duration-(--qh-duration-fast) group-aria-checked:translate-x-4 group-aria-checked:bg-on-accent group-aria-disabled:bg-line-strong"
      />
    </button>
    <div v-if="label || description || $slots.note" class="flex min-w-0 flex-col">
      <span v-if="label" :id="labelId" class="text-sm font-semibold">{{ label }}</span>
      <span v-if="description" class="text-sm text-muted">{{ description }}</span>
      <span v-if="$slots.note" :id="noteId" class="text-meta text-muted"><slot name="note" /></span>
    </div>
  </div>
</template>
