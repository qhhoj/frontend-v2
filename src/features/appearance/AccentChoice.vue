<script setup lang="ts">
import { ACCENTS } from '@/theme/appearance';
import { useAppearanceChoice } from './use-appearance-choice';

defineProps<{ disabled?: boolean }>();
const { shown, update } = useAppearanceChoice();
/** With the look off the theme's own preset shows as selected: choosing it turns the look on without changing anything. */
const isPressed = (accent: string) => shown.value.accent === accent;
</script>

<template>
  <div
    role="group"
    :aria-label="$t('appearance.accentTitle')"
    class="grid grid-cols-[repeat(4,2.75rem)] gap-1"
  >
    <button
      v-for="preset in ACCENTS"
      :key="preset.id"
      type="button"
      :disabled="disabled"
      :aria-label="$t(preset.labelKey)"
      :aria-pressed="isPressed(preset.id)"
      class="inline-flex size-11 items-center justify-center rounded-full border-2 disabled:cursor-not-allowed disabled:border-dashed disabled:bg-surface-strong"
      :class="
        isPressed(preset.id) ? 'border-content' : 'border-transparent disabled:border-line-strong'
      "
      @click="update({ accent: preset.id })"
    >
      <!-- The swatch carries its own preset's tokens (themes/*.css match any descendant [data-accent]). -->
      <span :data-accent="preset.id" class="bg-gradient-accent size-7 rounded-full" />
    </button>
  </div>
</template>
