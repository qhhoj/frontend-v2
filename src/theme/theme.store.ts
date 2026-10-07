import { defineStore } from 'pinia';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { AUTO_THEME, resolveTheme, THEMES } from './registry';
import type { ColorScheme } from './registry';

const PREFERENCE_KEY = 'qhhoj.theme';
/** The theme last painted, whatever chose it. Read by the pre-paint script in index.html to avoid a flash. */
const RESOLVED_KEY = 'qhhoj.resolvedTheme';
const LIGHT_QUERY = '(prefers-color-scheme: light)';

/** No preference or `no-preference` counts as dark: Glass is dark-first. */
const schemeOf = (prefersLight: boolean): ColorScheme => (prefersLight ? 'light' : 'dark');

export const useThemeStore = defineStore('theme', () => {
  const storedPreference = readStorage(PREFERENCE_KEY);
  const preference = ref(storedPreference ?? AUTO_THEME);
  /** The signed-in account's `siteTheme`; it outranks the browser preference until `adopt(null)`. */
  const accountTheme = ref<string | null>(null);

  // Without an explicit local choice the pre-painted theme stays until the account or the OS says otherwise.
  const cachedTheme =
    storedPreference === null
      ? THEMES.find((theme) => theme.id === readStorage(RESOLVED_KEY))
      : undefined;
  const holdingCache = ref(cachedTheme !== undefined);

  const media = matchMedia(LIGHT_QUERY);
  const systemScheme = ref(schemeOf(media.matches));
  const onSystemChange = (event: { matches: boolean }) => {
    systemScheme.value = schemeOf(event.matches);
    holdingCache.value = false;
  };
  media.addEventListener('change', onSystemChange);
  onScopeDispose(() => media.removeEventListener('change', onSystemChange));

  const theme = computed(
    () =>
      (holdingCache.value ? cachedTheme : undefined) ??
      resolveTheme(accountTheme.value ?? preference.value, systemScheme.value),
  );
  watch(
    theme,
    (active) => {
      const root = document.documentElement;
      root.dataset.theme = active.id;
      root.style.colorScheme = active.scheme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--qh-ground').trim());
      if (!holdingCache.value) writeStorage(RESOLVED_KEY, active.id);
    },
    { immediate: true },
  );

  /** A user action: applies the theme and remembers it as this browser's preference. */
  function choose(value: string) {
    accountTheme.value = null;
    holdingCache.value = false;
    preference.value = value;
    writeStorage(PREFERENCE_KEY, value);
  }

  /**
   * The signed-in account's theme, or `null` once signed out: applies it without touching the browser's
   * own preference; `null` goes back to the browser preference, then the OS scheme.
   */
  function adopt(value: string | null) {
    accountTheme.value = value;
    holdingCache.value = false;
  }

  return { preference, theme, choose, adopt };
});
