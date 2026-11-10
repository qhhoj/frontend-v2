<script setup lang="ts">
import IconButton from '@/components/ui/IconButton.vue';
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
    <IconButton
      v-for="preset in ACCENTS"
      :key="preset.id"
      tone="ghost"
      class="aria-pressed:ring-2 aria-pressed:ring-content"
      :disabled="disabled"
      :label="$t(preset.labelKey)"
      :pressed="isPressed(preset.id)"
      @click="update({ accent: preset.id })"
    >
      <!-- The swatch carries its own preset's tokens (themes/*.css match any descendant [data-accent]). -->
      <span :data-accent="preset.id" class="bg-gradient-accent size-7 rounded-full" />
    </IconButton>
  </div>
</template>
