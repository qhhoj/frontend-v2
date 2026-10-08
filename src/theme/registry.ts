import type { AccentId } from './appearance';

export type ColorScheme = 'dark' | 'light';

export interface ThemeDefinition {
  /** `html[data-theme]` value, the CSS file name in `themes/` and the value saved as a preference. */
  id: string;
  labelKey: string;
  scheme: ColorScheme;
  /** Frosted surfaces over background blobs (Glass); flat themes (Clay) are opaque with no blobs. */
  glass: boolean;
  /** The theme's own accent preset: its base values equal that preset's rule (themes.spec.ts), and a look turned on starts from it. */
  accent: AccentId;
}

/**
 * The single source of themes; the first theme of a scheme is that scheme's default. Add a theme: a CSS file in themes/, its import in styles.css, an entry here, its label in both locale files.
 * A new theme also goes into `grounds` in the pre-paint script of index.html; as the default for its scheme it is also listed first here and replaces the fallback id there.
 */
export const THEMES: readonly ThemeDefinition[] = [
  { id: 'clay-light', labelKey: 'theme.clayLight', scheme: 'light', glass: false, accent: 'clay' },
  { id: 'clay-dark', labelKey: 'theme.clayDark', scheme: 'dark', glass: false, accent: 'clay' },
  {
    id: 'glass-light',
    labelKey: 'theme.glassLight',
    scheme: 'light',
    glass: true,
    accent: 'orchid',
  },
  { id: 'glass-dark', labelKey: 'theme.glassDark', scheme: 'dark', glass: true, accent: 'orchid' },
];

/**
 * A preference is what the browser or the account's `siteTheme` stores (the backend takes any `^[a-z][a-z0-9-]{0,31}$`):
 * a theme id, or one of two automatic values that follow the device scheme within a style.
 * `auto` is Clay (also the legacy default); `glass-auto` is Glass.
 */
export const AUTO_THEME = 'auto';
export const GLASS_AUTO_THEME = 'glass-auto';

/** Values saved before Clay existed: every existing account holds one, and they now mean Clay. */
const LEGACY_PREFERENCES: Record<string, string> = { light: 'clay-light', dark: 'clay-dark' };

export const canonicalPreference = (preference: string): string =>
  Object.hasOwn(LEGACY_PREFERENCES, preference) ? LEGACY_PREFERENCES[preference]! : preference;

/** An unknown or retired preference, like `auto`, resolves to the Clay theme of the system scheme. */
export const resolveTheme = (preference: string, systemScheme: ColorScheme): ThemeDefinition => {
  const wanted = canonicalPreference(preference);
  const glass = wanted === GLASS_AUTO_THEME;
  return (
    THEMES.find((theme) => theme.id === wanted) ??
    THEMES.find((theme) => theme.scheme === systemScheme && theme.glass === glass) ??
    THEMES[0]!
  );
};
