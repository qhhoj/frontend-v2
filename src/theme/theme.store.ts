import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { AUTO_THEME, resolveTheme } from './registry';
import type { ColorScheme } from './registry';

const PREFERENCE_KEY = 'qhhoj.theme';
/** Read by the pre-paint script in index.html. */
const RESOLVED_KEY = 'qhhoj.resolvedTheme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

/** No preference or `no-preference` counts as dark: Glass is dark-first. */
const schemeOf = (prefersLight: boolean): ColorScheme => (prefersLight ? 'light' : 'dark');

export const useThemeStore = defineStore('theme', () => {
  const preference = ref(readStorage(PREFERENCE_KEY) ?? AUTO_THEME);
  const media = matchMedia(LIGHT_QUERY);
  const systemScheme = ref(schemeOf(media.matches));
  media.addEventListener('change', (event) => (systemScheme.value = schemeOf(event.matches)));

  const theme = computed(() => resolveTheme(preference.value, systemScheme.value));
  watch(
    theme,
    (active) => {
      document.documentElement.dataset.theme = active.id;
      document.documentElement.style.colorScheme = active.scheme;
      writeStorage(RESOLVED_KEY, active.id);
    },
    { immediate: true },
  );

  /** A user action: applies the theme and remembers it as this browser's preference. */
  function choose(value: string) {
    preference.value = value;
    writeStorage(PREFERENCE_KEY, value);
  }

  /** The signed-in account's theme: applies it without overwriting the browser's own preference. */
  function adopt(value: string) {
    preference.value = value;
  }

  return { preference, theme, choose, adopt };
});
