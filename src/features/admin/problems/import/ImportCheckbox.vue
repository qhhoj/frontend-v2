<script setup lang="ts">
import { useId } from 'vue';

/** An import option saved with the form: a checkbox, its label and an optional one-line description. */
const model = defineModel<boolean>({ required: true });
defineProps<{ label: string; description?: string }>();
const id = useId();
</script>

<template>
  <div class="flex items-start gap-3">
    <input
      :id="id"
      v-model="model"
      type="checkbox"
      class="mt-0.5 size-5 shrink-0 accent-[var(--qh-accent)]"
      :aria-describedby="description ? `${id}-description` : undefined"
    />
    <div class="flex min-w-0 flex-col">
      <label :for="id" class="cursor-pointer text-sm font-semibold">{{ label }}</label>
      <p v-if="description" :id="`${id}-description`" class="text-sm text-muted">
        {{ description }}
      </p>
    </div>
  </div>
</template>
