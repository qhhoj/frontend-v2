<script setup lang="ts">
import { computed } from 'vue';
import { useThemeChoice } from '@/features/shell/use-theme-choice';
import { translate } from '@/i18n';
import { AUTO_THEME, canonicalPreference, GLASS_AUTO_THEME, THEMES } from '@/theme/registry';
import type { ColorScheme } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';
import SegmentedChoice from './SegmentedChoice.vue';

type Style = 'clay' | 'glass';
type Mode = ColorScheme | 'auto';

/** `modeOnly`: light, dark or the device's, without the style (the phone menu; the panel and settings show both). */
defineProps<{ modeOnly?: boolean }>();
const theme = useThemeStore();
const chooseTheme = useThemeChoice();

const styleOptions = computed<Array<{ value: Style; label: string }>>(() => [
  { value: 'clay', label: translate('theme.styleClay') },
  { value: 'glass', label: translate('theme.styleGlass') },
]);
const modeOptions = computed(() =>
  (['light', 'dark', 'auto'] as const).map((mode) => ({
    value: mode,
    label: translate(`appearance.modeOption.${mode}`),
  })),
);

/** The style of the theme on screen (an unknown or retired preference resolves to Clay). */
const style = computed<Style>(() => (theme.theme.glass ? 'glass' : 'clay'));
/** A theme id (legacy `light`/`dark` included) is that theme's scheme; `auto`, `glass-auto` and anything unknown follow the device. */
const mode = computed<Mode>(
  () =>
    THEMES.find((entry) => entry.id === canonicalPreference(theme.preference))?.scheme ?? 'auto',
);

/** One of the six preferences: `auto`, `glass-auto`, or the theme of that style and scheme. */
const preferenceOf = (nextStyle: Style, nextMode: Mode): string => {
  const isGlass = nextStyle === 'glass';
  if (nextMode === 'auto') return isGlass ? GLASS_AUTO_THEME : AUTO_THEME;
  const chosen = THEMES.find((entry) => entry.glass === isGlass && entry.scheme === nextMode);
  // Every style has a light and a dark theme (registry), so this only guards a registry edit.
  if (!chosen) throw new Error(`No ${nextStyle} theme for mode ${nextMode}`);
  return chosen.id;
};
</script>

<template>
  <!-- Mode is the theme preference (siteTheme), not part of the personal look: picking it never turns the look on. -->
  <div class="flex flex-col gap-2">
    <SegmentedChoice
      v-if="!modeOnly"
      :label="$t('appearance.style')"
      :options="styleOptions"
      :selected="style"
      @pick="(nextStyle) => void chooseTheme(preferenceOf(nextStyle, mode))"
    />
    <SegmentedChoice
      :label="$t('appearance.mode')"
      :options="modeOptions"
      :selected="mode"
      @pick="(nextMode) => void chooseTheme(preferenceOf(style, nextMode))"
    />
  </div>
</template>
