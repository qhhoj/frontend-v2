<script setup lang="ts" generic="Value extends string | number">
defineProps<{
  label: string;
  options: ReadonlyArray<{ value: Value; label: string }>;
  selected: Value | null;
  disabled?: boolean;
}>();
defineEmits<{ pick: [value: Value] }>();
</script>

<template>
  <div role="group" :aria-label="label" class="flex gap-1 rounded-pill bg-surface-strong p-1">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      :disabled="disabled"
      :aria-pressed="option.value === selected"
      class="min-h-11 flex-1 rounded-pill border px-2 text-sm leading-tight disabled:cursor-not-allowed disabled:border-line disabled:bg-surface-strong disabled:text-muted"
      :class="
        option.value === selected
          ? 'border-accent bg-accent-soft font-semibold text-accent-soft-text'
          : 'border-transparent text-muted hover:text-content'
      "
      @click="$emit('pick', option.value)"
    >
      {{ option.label }}
    </button>
  </div>
</template>
