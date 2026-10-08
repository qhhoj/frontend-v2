import { defineStore } from 'pinia';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { AUTO_THEME, resolveTheme, THEMES } from './registry';
import type { ColorScheme } from './registry';

const PREFERENCE_KEY = 'qhhoj.theme';
/** The theme last painted, whatever chose it. Read by the pre-paint script in index.html to avoid a flash. */
const RESOLVED_KEY = 'qhhoj.resolvedTheme';
/** Who painted it: `account` (an adopted `siteTheme`) or `local` (the browser preference and the OS). Only account paints are held at start-up. */
const RESOLVED_BY_KEY = 'qhhoj.resolvedBy';
const DARK_QUERY = '(prefers-color-scheme: dark)';

/** No preference counts as light: Clay & ivory is light-first. */
const schemeOf = (prefersDark: boolean): ColorScheme => (prefersDark ? 'dark' : 'light');

export const useThemeStore = defineStore('theme', () => {
  const storedPreference = readStorage(PREFERENCE_KEY);
  const localPreference = ref(storedPreference ?? AUTO_THEME);
  /** The signed-in account's `siteTheme`; it outranks the browser preference until `adopt(null)`. */
  const accountTheme = ref<string | null>(null);

  // A theme painted from the account stays until the account, a choice or the OS says otherwise: the local
  // preference cannot know the account's theme, while `auto` and `glass-auto` resolve afresh by today's OS scheme.
  const cachedTheme = THEMES.find((theme) => theme.id === readStorage(RESOLVED_KEY));
  const holdingCache = ref(cachedTheme !== undefined && readStorage(RESOLVED_BY_KEY) === 'account');

  const media = typeof matchMedia === 'function' ? matchMedia(DARK_QUERY) : undefined;
  const systemScheme = ref(schemeOf(media?.matches ?? false));
  const onSystemChange = (event: { matches: boolean }) => {
    systemScheme.value = schemeOf(event.matches);
    holdingCache.value = false;
  };
  media?.addEventListener('change', onSystemChange);
  onScopeDispose(() => media?.removeEventListener('change', onSystemChange));

  /** What the Style and Mode controls show as selected: the account's theme while signed in, else the browser's choice. */
  const preference = computed(() => accountTheme.value ?? localPreference.value);
  const theme = computed(
    () =>
      (holdingCache.value ? cachedTheme : undefined) ??
      resolveTheme(preference.value, systemScheme.value),
  );
  watch(
    theme,
    (active) => {
      const root = document.documentElement;
      // The pre-paint script usually has set it already; an identical write would still notify observers.
      if (root.dataset.theme !== active.id) root.dataset.theme = active.id;
      root.style.colorScheme = active.scheme;
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', getComputedStyle(root).getPropertyValue('--qh-ground').trim());
      if (!holdingCache.value) {
        writeStorage(RESOLVED_KEY, active.id);
        writeStorage(RESOLVED_BY_KEY, accountTheme.value === null ? 'local' : 'account');
      }
    },
    { immediate: true },
  );

  /** A user action: applies the theme and remembers it as this browser's preference. */
  function choose(value: string) {
    accountTheme.value = null;
    holdingCache.value = false;
    localPreference.value = value;
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
