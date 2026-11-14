<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { BACKGROUNDS } from '@/theme/appearance';
import { useAppearanceChoice } from './use-appearance-choice';

const { shown, update } = useAppearanceChoice();
</script>

<template>
  <!-- Each thumbnail is the real background drawn by backgrounds.css, so the grid shows what a click does. -->
  <div
    role="group"
    :aria-label="$t('appearance.backgroundTitle')"
    class="grid grid-cols-[repeat(auto-fill,minmax(5.25rem,1fr))] gap-2.5"
  >
    <AppButton
      v-for="choice in BACKGROUNDS"
      :key="choice.id"
      tone="ghost"
      :pressed="shown.background === choice.id"
      class="group h-auto! min-h-11 rounded-cell! flex-col gap-1.5 p-1.5! text-center"
      @click="update({ background: choice.id })"
    >
      <span
        :data-background="choice.id"
        class="background-sample block h-16 w-full rounded-cell border border-line-control"
      />
      <span
        class="text-caption leading-4 font-normal whitespace-normal text-muted group-aria-pressed:font-semibold group-aria-pressed:text-content"
        >{{ $t(choice.labelKey) }}</span
      >
    </AppButton>
  </div>
</template>
