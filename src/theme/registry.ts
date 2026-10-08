export type ColorScheme = 'dark' | 'light';

export interface ThemeDefinition {
  /** `html[data-theme]` value and the CSS file name in `themes/`. */
  id: string;
  labelKey: string;
  scheme: ColorScheme;
  /** The value saved in the account's `siteTheme` (backend allows `auto | light | dark` today). */
  storedAs: string;
  /** Frosted surfaces over background blobs (Glass). Flat themes (Clay) ignore the personal Glass and Glow levels. */
  glass: boolean;
}

/**
 * The single source of themes. Add a theme: a CSS file in themes/, its import in styles.css, an entry here, its label in both locale files.
 * A new theme also goes into `grounds` in the pre-paint script of index.html; as the default for its scheme it also replaces the fallback id there.
 */
export const THEMES: readonly ThemeDefinition[] = [
  { id: 'glass-dark', labelKey: 'theme.glassDark', scheme: 'dark', storedAs: 'dark', glass: true },
  {
    id: 'glass-light',
    labelKey: 'theme.glassLight',
    scheme: 'light',
    storedAs: 'light',
    glass: true,
  },
  {
    id: 'clay-light',
    labelKey: 'theme.clayLight',
    scheme: 'light',
    storedAs: 'clay-light',
    glass: false,
  },
  {
    id: 'clay-dark',
    labelKey: 'theme.clayDark',
    scheme: 'dark',
    storedAs: 'clay-dark',
    glass: false,
  },
];

export const AUTO_THEME = 'auto';

/** `auto`, an unknown or a retired preference all resolve to the first theme of the system scheme. */
export const resolveTheme = (preference: string, systemScheme: ColorScheme): ThemeDefinition =>
  THEMES.find((theme) => theme.storedAs === preference || theme.id === preference) ??
  THEMES.find((theme) => theme.scheme === systemScheme) ??
  THEMES[0]!;
