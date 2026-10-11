<script setup lang="ts" generic="T extends string">
/**
 * One choice among a few, each with a one-line explanation: a fieldset of radio cards (whole card clickable, 44 px on a
 * coarse pointer, the checked card framed in the accent). For long lists use a select instead.
 */
const model = defineModel<T>({ required: true });
defineProps<{
  legend: string;
  name: string;
  options: { value: T; label: string; description: string }[];
}>();
</script>

<template>
  <fieldset class="m-0 flex min-w-0 flex-col gap-2 border-0 p-0">
    <legend class="mb-1.5 text-sm font-semibold">{{ legend }}</legend>
    <div class="grid gap-2 sm:grid-cols-2">
      <label
        v-for="option in options"
        :key="option.value"
        :data-testid="`${name}-${option.value}`"
        class="flex min-h-11 cursor-pointer items-start gap-3 rounded-cell border px-3 py-2.5 transition-colors has-[:checked]:border-accent has-[:checked]:bg-surface-hover has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
        :class="model === option.value ? 'border-accent' : 'border-line hover:bg-surface-hover'"
      >
        <input
          v-model="model"
          type="radio"
          :name="name"
          :value="option.value"
          class="mt-0.5 size-4 shrink-0 accent-[var(--qh-accent)]"
        />
        <span class="flex min-w-0 flex-col">
          <span class="text-sm font-semibold">{{ option.label }}</span>
          <span class="text-sm text-muted">{{ option.description }}</span>
        </span>
      </label>
    </div>
  </fieldset>
</template>
