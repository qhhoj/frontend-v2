export type ColorScheme = 'dark' | 'light';

export interface ThemeDefinition {
  /** `html[data-theme]` value and the value saved as a preference; its colours are src/theme/palette/paper-<id>.css. */
  id: string;
  scheme: ColorScheme;
}

/**
 * The two modes of palette A (Paper & Ultramarine); the first is the default. The pre-paint script in index.html keeps
 * each id's ground in `grounds` (prepaint.spec.ts enforces it).
 */
export const THEMES: readonly ThemeDefinition[] = [
  { id: 'light', scheme: 'light' },
  { id: 'dark', scheme: 'dark' },
];

/** A preference is what the browser or the account's `siteTheme` stores: a theme id, or `auto` (follows the device). */
export const AUTO_THEME = 'auto';

/**
 * The Clay and Glass theme ids (retired 2026-11-15) and what each became; the backend maps `siteTheme` the same way on
 * read. The pre-paint script's `legacy` must match.
 */
export const LEGACY_PREFERENCES: Readonly<Record<string, string>> = {
  'clay-light': 'light',
  'glass-light': 'light',
  'clay-dark': 'dark',
  'glass-dark': 'dark',
  'glass-auto': AUTO_THEME,
};

export const canonicalPreference = (preference: string): string =>
  Object.hasOwn(LEGACY_PREFERENCES, preference) ? LEGACY_PREFERENCES[preference]! : preference;

/** `auto`, or an unknown preference, resolves to the theme of the system scheme. */
export const resolveTheme = (preference: string, systemScheme: ColorScheme): ThemeDefinition => {
  const wanted = canonicalPreference(preference);
  return (
    THEMES.find((theme) => theme.id === wanted) ??
    THEMES.find((theme) => theme.scheme === systemScheme) ??
    THEMES[0]!
  );
};
