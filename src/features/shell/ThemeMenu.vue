<script setup lang="ts">
import { Check, Monitor, Moon, Sun } from 'lucide-vue-next';
import Menu from 'primevue/menu';
import type { MenuItem } from 'primevue/menuitem';
import { computed, ref } from 'vue';
import { translate } from '@/i18n';
import { AUTO_THEME, THEMES } from '@/theme/registry';
import { useThemeStore } from '@/theme/theme.store';
import { useThemeChoice } from './use-theme-choice';

const theme = useThemeStore();
const chooseTheme = useThemeChoice();
const menu = ref<InstanceType<typeof Menu>>();
const isOpen = ref(false);

const OPTIONS = [
  { value: AUTO_THEME, labelKey: 'theme.auto' },
  ...THEMES.map((entry) => ({ value: entry.storedAs, labelKey: entry.labelKey })),
];
const items = computed<MenuItem[]>(() =>
  OPTIONS.map((option) => ({
    label: translate(option.labelKey),
    current: theme.preference === option.value,
    command: () => void chooseTheme(option.value),
  })),
);
const icon = computed(() =>
  theme.preference === AUTO_THEME ? Monitor : theme.theme.scheme === 'light' ? Sun : Moon,
);
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
  </Menu>
</template>
