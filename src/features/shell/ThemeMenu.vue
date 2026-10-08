<script setup lang="ts">
import { Check, Monitor, Moon, Sun } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { AUTO_THEME, canonicalPreference, GLASS_AUTO_THEME, THEMES } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';
import { useThemeChoice } from './use-theme-choice';

const theme = useThemeStore();
const chooseTheme = useThemeChoice();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

/** Choices grouped by style: the style's themes, then its automatic option that follows the device. */
const STYLES = [
  {
    labelKey: 'theme.styleClay',
    glass: false,
    auto: { value: AUTO_THEME, labelKey: 'theme.clayAuto' },
  },
  {
    labelKey: 'theme.styleGlass',
    glass: true,
    auto: { value: GLASS_AUTO_THEME, labelKey: 'theme.glassAuto' },
  },
].map((style) => ({
  labelKey: style.labelKey,
  options: [
    ...THEMES.filter((entry) => entry.glass === style.glass).map((entry) => ({
      value: entry.id,
      labelKey: entry.labelKey,
    })),
    style.auto,
  ],
}));
const items = computed<MenuItem[]>(() =>
  STYLES.map((style) => ({
    label: translate(style.labelKey),
    items: style.options.map((option) => ({
      label: translate(option.labelKey),
      current: canonicalPreference(theme.preference) === option.value,
      command: () => void chooseTheme(option.value),
    })),
  })),
);
const isAuto = computed(() => [AUTO_THEME, GLASS_AUTO_THEME].includes(theme.preference));
const icon = computed(() => (isAuto.value ? Monitor : theme.theme.scheme === 'light' ? Sun : Moon));
</script>

<template>
  <button
    type="button"
    class="inline-flex size-11 items-center justify-center rounded-pill border border-line bg-surface-strong hover:bg-surface-hover"
    aria-haspopup="menu"
    :aria-expanded="isOpen"
    :aria-label="$t('theme.menu')"
    @click="menu?.toggle($event)"
  >
    <component :is="icon" class="size-5" aria-hidden="true" />
  </button>
  <Menu ref="menu" :model="items" popup @show="isOpen = true" @hide="isOpen = false">
    <template #item="{ item, props: itemProps }">
      <a
        v-bind="itemProps.action"
        class="flex min-h-11 cursor-pointer items-center gap-3 px-3 text-sm text-content"
      >
        <Check v-if="item.current" class="size-4 text-accent-text" aria-hidden="true" />
        <span v-else class="size-4" aria-hidden="true" />
        <span>{{ item.label }}</span>
        <span v-if="item.current" class="sr-only">({{ $t('theme.current') }})</span>
      </a>
    </template>
    <template #submenulabel="{ item }">
      <span class="block px-3 pt-2 text-xs font-semibold uppercase tracking-wide text-muted">{{
        item.label
      }}</span>
    </template>
  </Menu>
</template>
