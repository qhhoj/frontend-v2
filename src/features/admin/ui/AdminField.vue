<script setup lang="ts">
import { computed, useId } from 'vue';

const props = defineProps<{ label: string; hint?: string; error?: string; inputId?: string }>();
/** A fixed `inputId` lets a form give its inputs stable ids (`problem-name`); otherwise the generated one (useId runs unconditionally). */
const generatedId = useId();
const id = props.inputId ?? generatedId;
const hintId = `${id}-hint`;
const errorId = `${id}-error`;
const describedBy = computed(
  () =>
    [props.error ? errorId : null, props.hint ? hintId : null].filter(Boolean).join(' ') ||
    undefined,
);
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="text-sm font-semibold">{{ label }}</label>
    <slot :id="id" :described-by="describedBy" :invalid="error ? 'true' : undefined" />
    <p v-if="error" :id="errorId" class="text-sm text-negative">{{ error }}</p>
    <p v-if="hint" :id="hintId" class="text-xs text-muted">{{ hint }}</p>
  </div>
</template>
