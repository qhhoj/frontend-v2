<script setup lang="ts">
import { computed, provide, useId } from 'vue';
import { FIELD_CONTROL } from './FormField.control';
import type { FieldControl } from './FormField.control';
import FormFieldError from './FormFieldError.vue';

/**
 * One labelled field: the label (with `#label-end` on its right), the control in the default slot, `#after` (a meter, a
 * counter), then the hint, or the error in its place. The control gets `id`, `describedBy` and `invalid` as slot props and
 * by inject (`TextInput`, `SelectField`, `TextArea` read them on their own). `required` adds a star and a hidden "bắt buộc";
 * `optional` adds "(tuỳ chọn)". `describedBy` adds ids of other elements that describe the control.
 * `scale="admin"` keeps the admin forms' 12 px hint and 14 px error until that area moves to the 13 px pair.
 */
const props = withDefaults(
  defineProps<{
    label: string;
    hint?: string;
    error?: string;
    inputId?: string;
    required?: boolean;
    optional?: boolean;
    describedBy?: string;
    scale?: 'meta' | 'admin';
  }>(),
  {
    hint: undefined,
    error: undefined,
    inputId: undefined,
    describedBy: undefined,
    scale: 'meta',
  },
);
/** A fixed `inputId` gives a form stable ids (`problem-name`); otherwise the generated one (useId runs unconditionally). */
const generatedId = useId();
const id = props.inputId ?? generatedId;
const hintId = `${id}-hint`;
const errorId = `${id}-error`;
const control = computed<FieldControl>(() => {
  const ownId = props.error ? errorId : props.hint ? hintId : undefined;
  return {
    id,
    describedBy: [ownId, props.describedBy].filter(Boolean).join(' ') || undefined,
    invalid: props.error ? 'true' : undefined,
  };
});
provide(FIELD_CONTROL, control);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <div class="flex items-baseline justify-between gap-3">
      <label :for="id" class="text-sm font-semibold text-content">
        {{ label
        }}<template v-if="required"
          ><span aria-hidden="true" class="ml-0.5 text-negative">*</span
          ><span class="sr-only">{{ $t('form.required') }}</span></template
        ><span v-if="optional" class="font-normal text-muted">{{ ` ${$t('form.optional')}` }}</span>
      </label>
      <slot name="label-end" />
    </div>
    <slot v-bind="control" />
    <slot name="after" />
    <FormFieldError v-if="error" :id="errorId" :message="error" :scale="scale" />
    <p
      v-else-if="hint"
      :id="hintId"
      class="text-muted"
      :class="scale === 'admin' ? 'text-xs' : 'text-meta'"
    >
      {{ hint }}
    </p>
  </div>
</template>
