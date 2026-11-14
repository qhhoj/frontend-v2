<script setup lang="ts">
import { computed } from 'vue';
import { useThemeChoice } from '@/features/shell/use-theme-choice';
import { translate } from '@/i18n';
import { AUTO_THEME, canonicalPreference, THEMES } from '@/theme/registry';
import type { ColorScheme } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';
import SegmentedChoice from './SegmentedChoice.vue';

type Mode = ColorScheme | typeof AUTO_THEME;

const theme = useThemeStore();
const chooseTheme = useThemeChoice();

const modeOptions = computed(() =>
  (['light', 'dark', AUTO_THEME] as const).map((mode) => ({
    value: mode,
    label: translate(`appearance.modeOption.${mode}`),
  })),
);

/** A theme id (a retired Clay or Glass id included) is that theme's mode; `auto` and anything unknown follow the device. */
const mode = computed<Mode>(
  () =>
    THEMES.find((entry) => entry.id === canonicalPreference(theme.preference))?.scheme ??
    AUTO_THEME,
);
</script>

<template>
  <!-- Mode is the theme preference (siteTheme), not part of the personal look: picking it never sets a look. -->
  <SegmentedChoice
    :label="$t('appearance.mode')"
    :options="modeOptions"
    :selected="mode"
    @pick="(nextMode) => void chooseTheme(nextMode)"
  />
</template>
