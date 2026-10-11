<script setup lang="ts">
import { computed, useId } from 'vue';
import { CircleAlert } from 'lucide-vue-next';

/**
 * One labelled field: the label above, the input in the slot, then the hint, or the error in its place (icon and text, linked
 * by `aria-describedby`). `required` adds a visible star and a hidden "bắt buộc" for screen readers.
 */
const props = defineProps<{
  label: string;
  hint?: string;
  error?: string;
  inputId?: string;
  required?: boolean;
}>();
/** A fixed `inputId` lets a form give its inputs stable ids (`problem-name`); otherwise the generated one (useId runs unconditionally). */
const generatedId = useId();
const id = props.inputId ?? generatedId;
const hintId = `${id}-hint`;
const errorId = `${id}-error`;
const describedBy = computed(() => (props.error ? errorId : props.hint ? hintId : undefined));
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-semibold">
      {{ label
      }}<template v-if="required"
        ><span aria-hidden="true" class="ml-0.5 text-negative">*</span
        ><span class="sr-only">{{ $t('admin.form.required') }}</span></template
      >
    </label>
    <slot :id="id" :described-by="describedBy" :invalid="error ? 'true' : undefined" />
    <p v-if="error" :id="errorId" class="flex items-start gap-1.5 text-sm text-negative">
      <CircleAlert class="mt-0.5 size-3.5 shrink-0" aria-hidden="true" :stroke-width="1.75" />
      <span>{{ error }}</span>
    </p>
    <p v-else-if="hint" :id="hintId" class="text-xs text-muted">{{ hint }}</p>
  </div>
</template>
