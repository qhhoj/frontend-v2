<script setup lang="ts">
import AppButton from '@/components/ui/AppButton.vue';
import { paletteLabelKey, PALETTES, swatchOf } from '@/theme/palette';
import { usePaletteStore } from '@/theme/palette.store';
import { useThemeStore } from '@/theme/theme.store';

const palette = usePaletteStore();
const theme = useThemeStore();
</script>

<template>
  <!-- Each card paints the palette's own ground, surface, accent and cue colours in the mode shown now. -->
  <div
    role="group"
    :aria-label="$t('appearance.paletteTitle')"
    class="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
  >
    <AppButton
      v-for="choice in PALETTES"
      :key="choice.id"
      tone="ghost"
      :pressed="palette.current === choice.id"
      class="group h-auto! min-h-11 rounded-cell! flex-col justify-start gap-1.5 p-1.5! text-center"
      @click="palette.choose(choice.id)"
    >
      <span
        class="flex h-12 w-full flex-col justify-end rounded-cell border border-line-control p-2"
        :style="{ backgroundColor: swatchOf(choice.id, theme.theme.scheme).ground }"
      >
        <span
          class="flex items-center gap-1.5 rounded-control p-1.5"
          :style="{ backgroundColor: swatchOf(choice.id, theme.theme.scheme).surface }"
        >
          <span
            v-for="role in ['accent', 'accepted', 'wrong', 'upcoming'] as const"
            :key="role"
            class="size-3 rounded-full"
            :style="{ backgroundColor: swatchOf(choice.id, theme.theme.scheme)[role] }"
          />
        </span>
      </span>
      <span
        class="text-caption leading-4 font-normal whitespace-normal text-muted group-aria-pressed:font-semibold group-aria-pressed:text-content"
        >{{ $t(paletteLabelKey(choice.id)) }}</span
      >
    </AppButton>
  </div>
</template>
