<script setup lang="ts">
import IconButton from '@/components/ui/IconButton.vue';
import { ACCENTS } from '@/theme/appearance';
import { useAppearanceChoice } from './use-appearance-choice';

const { shown, update } = useAppearanceChoice();
</script>

<template>
  <div
    role="group"
    :aria-label="$t('appearance.accentTitle')"
    class="grid grid-cols-[repeat(5,2.75rem)] gap-1"
  >
    <IconButton
      v-for="preset in ACCENTS"
      :key="preset.id"
      tone="ghost"
      class="aria-pressed:ring-2 aria-pressed:ring-content"
      :label="$t(preset.labelKey)"
      :pressed="shown.accent === preset.id"
      @click="update({ accent: preset.id })"
    >
      <!-- The swatch carries its own accent's tokens (palette/accents.css matches any descendant [data-accent]). -->
      <span :data-accent="preset.id" class="size-7 rounded-full bg-accent" />
    </IconButton>
  </div>
</template>
