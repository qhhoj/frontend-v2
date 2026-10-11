<script setup lang="ts">
import type { ListDensity } from './use-list-density';

/** "Gọn" / "Rộng": the row density of the list, two pressed-state buttons in one pill. */
defineProps<{ modelValue: ListDensity }>();
const emit = defineEmits<{ 'update:modelValue': [density: ListDensity] }>();
const CHOICES: readonly ListDensity[] = ['compact', 'comfortable'];
</script>

<template>
  <div
    role="group"
    :aria-label="$t('submissions.density.label')"
    class="inline-flex h-10 shrink-0 overflow-hidden rounded-row border border-line-strong"
  >
    <button
      v-for="choice in CHOICES"
      :key="choice"
      type="button"
      :aria-pressed="modelValue === choice"
      class="px-3.5 text-sm font-semibold text-muted hover:bg-surface-hover aria-pressed:bg-surface-strong aria-pressed:text-content"
      @click="emit('update:modelValue', choice)"
    >
      {{ $t(`submissions.density.${choice}`) }}
    </button>
  </div>
</template>
