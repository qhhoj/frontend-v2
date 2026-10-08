import { describe, expect, it } from 'vitest';
import indexHtml from '/index.html?raw';
import { createPinia, setActivePinia } from 'pinia';
import { stubMatchMedia } from '@/test/match-media';
import { ACCENTS, appearanceVariables } from './appearance';
import { useAppearanceStore } from './appearance.store';
import { useThemeStore } from './theme.store';
import { AUTO_THEME, GLASS_AUTO_THEME, resolveTheme, THEMES } from './registry';

const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)![1]!;
const groundsOf = new Map(
  [.../grounds = \{([^}]*)\}/.exec(script)![1]!.matchAll(/'([\w-]+)':\s*'(#\w+)'/g)].map(
    ([, id, ground]) => [id!, ground!],
  ),
);
const themeFiles = import.meta.glob<string>('./themes/*.css', {
  query: '?raw',
  import: 'default',
  eager: true,
});
const groundOfThemeFile = (id: string) =>
  /--qh-ground:\s*(#\w+)/.exec(themeFiles[`./themes/${id}.css`]!)![1];
const firstThemeOf = (scheme: string) => THEMES.find((theme) => theme.scheme === scheme)!.id;

/** Every value `siteTheme` or the browser preference can hold, the legacy aliases and a retired one included. */
const PREFERENCES = [
  AUTO_THEME,
  GLASS_AUTO_THEME,
  ...THEMES.map((theme) => theme.id),
  'light',
  'dark',
  'neon-retired',
  'constructor',
  'toString',
  '__proto__',
];

/** Runs the real inline script against a stand-in page. */
function prepaint({
  stored = null as string | null,
  resolvedBy = 'account' as string | null,
  preference = null as string | null,
  painted = null as string | null,
  dark = false,
  storageThrows = false,
  mediaThrows = false,
}) {
  const properties: Record<string, string> = {};
  const root = {
    dataset: {} as Record<string, string>,
    style: { setProperty: (name: string, value: string) => (properties[name] = value) },
  };
  const themeColor = {
    content: '',
    setAttribute: (_name: string, value: string) => (themeColor.content = value),
  };
  const localStorageStub = {
    getItem: (key: string) => {
      if (storageThrows) throw new Error('storage blocked');
      if (key === 'qhhoj.resolvedTheme') return stored;
      if (key === 'qhhoj.resolvedBy') return resolvedBy;
      if (key === 'qhhoj.paintedAppearance') return painted;
      return key === 'qhhoj.theme' ? preference : null;
    },
  };
  const matchMediaStub = (query: string) => {
    if (mediaThrows) throw new Error('no matchMedia');
    return { matches: dark && query.includes('prefers-color-scheme: dark') };
  };
  // The script is the page's own source under test, so evaluating it here is the point.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('document', 'localStorage', 'matchMedia', script)(
    { documentElement: root, querySelector: () => themeColor },
    localStorageStub,
    matchMediaStub,
  );
  return {
    theme: root.dataset.theme,
    themeColor: themeColor.content,
    accent: root.dataset.accent,
    properties,
  };
}

describe('pre-paint script in index.html', () => {
  it('allows exactly the registered themes', () => {
    expect([...groundsOf.keys()].sort()).toEqual(THEMES.map((theme) => theme.id).sort());
  });

  it("sets the address-bar colour to the painted theme's ground", () => {
    for (const { id } of THEMES) {
      expect(prepaint({ stored: id }).themeColor).toBe(groundOfThemeFile(id));
    }
  });

  it('paints the last applied theme whatever the OS says', () => {
    expect(prepaint({ stored: 'glass-light', dark: true }).theme).toBe('glass-light');
    expect(prepaint({ stored: 'glass-dark', dark: false }).theme).toBe('glass-dark');
    expect(prepaint({ stored: 'clay-dark', dark: false }).theme).toBe('clay-dark');
  });

  it('resolves every stored preference like the app does when nothing was painted yet', () => {
    for (const preference of PREFERENCES)
      for (const dark of [false, true])
        expect(prepaint({ preference, dark }).theme, `${preference}, OS dark ${dark}`).toBe(
          resolveTheme(preference, dark ? 'dark' : 'light').id,
        );
  });

  it('paints the last painted theme only when the account chose it; a local paint resolves by the OS today', () => {
    expect(prepaint({ stored: 'clay-dark', resolvedBy: 'local', dark: false }).theme).toBe(
      'clay-light',
    );
    expect(prepaint({ stored: 'clay-dark', resolvedBy: null, dark: false }).theme).toBe(
      'clay-light',
    );
    expect(
      prepaint({ stored: 'clay-dark', resolvedBy: 'local', preference: 'glass-auto', dark: false })
        .theme,
    ).toBe('glass-light');
    expect(prepaint({ stored: 'clay-dark', resolvedBy: 'account', dark: false }).theme).toBe(
      'clay-dark',
    );
  });

  it('keeps the last painted theme for every preference, as the store does', () => {
    for (const preference of [null, ...PREFERENCES])
      expect(prepaint({ stored: 'glass-light', preference, dark: true }).theme).toBe('glass-light');
  });

  it('falls back to the default theme of the OS scheme for a missing or retired id', () => {
    expect(prepaint({ stored: null, dark: false }).theme).toBe(firstThemeOf('light'));
    expect(prepaint({ stored: null, dark: true }).theme).toBe(firstThemeOf('dark'));
    expect(prepaint({ stored: 'neon-retired', dark: true }).theme).toBe(firstThemeOf('dark'));
  });

  it('falls back to a flat Clay theme, never to Glass', () => {
    for (const dark of [false, true])
      expect(THEMES.find((theme) => theme.id === prepaint({ dark }).theme)?.glass).toBe(false);
  });

  it('still follows the OS when storage is blocked', () => {
    expect(prepaint({ storageThrows: true, dark: true }).theme).toBe(firstThemeOf('dark'));
  });

  it('paints light when matchMedia is unavailable', () => {
    expect(prepaint({ mediaThrows: true }).theme).toBe(firstThemeOf('light'));
  });

  it('declares the default light theme ground as the static theme-color, so the first frame matches', () => {
    const declared = /<meta name="theme-color" content="(#\w+)"/.exec(indexHtml)![1];
    expect(declared).toBe(groundOfThemeFile(firstThemeOf('light')));
  });

  it('paints what the store resolves at start-up, for every preference, cache and OS scheme', () => {
    for (const preference of [null, ...PREFERENCES])
      for (const cache of [null, ...THEMES.map((theme) => theme.id)])
        for (const resolvedBy of ['account', 'local', null])
          for (const dark of [false, true]) {
            localStorage.clear();
            if (preference !== null) localStorage.setItem('qhhoj.theme', preference);
            if (cache !== null) localStorage.setItem('qhhoj.resolvedTheme', cache);
            if (resolvedBy !== null) localStorage.setItem('qhhoj.resolvedBy', resolvedBy);
            delete document.documentElement.dataset.theme;
            stubMatchMedia({ dark });
            setActivePinia(createPinia());
            const fromStore = useThemeStore().theme.id;
            const painted = prepaint({ stored: cache, resolvedBy, preference, dark });
            expect(
              painted.theme,
              `preference ${preference}, cache ${cache} by ${resolvedBy}, OS dark ${dark}`,
            ).toBe(fromStore);
            expect(painted.themeColor).toBe(groundOfThemeFile(fromStore));
          }
  });
});

describe('pre-paint script: personal look', () => {
  const look = { accent: 'sunset', glass: 40, glow: 35 } as const;

  it('allows exactly the registered accent presets', () => {
    const listed = /var accents = \[([^\]]*)\]/
      .exec(script)![1]!
      .match(/'([\w-]+)'/g)!
      .map((id) => id.slice(1, -1));
    expect(listed).toEqual(ACCENTS.map((accent) => accent.id));
  });

  it('paints the last painted look exactly as the store would', () => {
    const { accent, properties } = prepaint({ painted: JSON.stringify(look) });
    const expected = appearanceVariables(look);
    expect(accent).toBe(expected.accent);
    expect(properties).toEqual({
      '--qh-glass-level': expected.glass,
      '--qh-blob-strength': expected.blobStrength,
    });
  });

  it('paints nothing when there is no look or it was turned off', () => {
    expect(prepaint({ painted: null }).accent).toBeUndefined();
    expect(prepaint({ painted: 'null' }).accent).toBeUndefined();
  });

  it.each([
    ['broken JSON', 'not json'],
    ['an unknown accent', '{"accent":"violet","glass":1,"glow":1}'],
    ['a fractional glass', '{"accent":"mint","glass":5.5,"glow":1}'],
    ['a glow above 100', '{"accent":"mint","glass":1,"glow":101}'],
    ['a numeric string', '{"accent":"mint","glass":"1","glow":1}'],
  ])('falls back to the site look for %s', (_name, painted) => {
    const result = prepaint({ painted });
    expect(result.accent).toBeUndefined();
    expect(result.properties).toEqual({});
  });

  it('still paints the theme when storage is blocked, and no look', () => {
    const result = prepaint({ storageThrows: true, dark: false });
    expect(result.theme).toBe(firstThemeOf('light'));
    expect(result.accent).toBeUndefined();
  });

  it('paints the look the store starts with, for no, a valid and an invalid painted look', () => {
    const paintedValues = [
      null,
      'null',
      JSON.stringify(look),
      'not json',
      '{"accent":"violet","glass":1,"glow":1}',
      '{"accent":"mint","glass":5.5,"glow":1}',
    ];
    for (const painted of paintedValues) {
      localStorage.clear();
      if (painted !== null) localStorage.setItem('qhhoj.paintedAppearance', painted);
      delete document.documentElement.dataset.accent;
      setActivePinia(createPinia());
      const fromStore = useAppearanceStore().look;
      const result = prepaint({ painted });
      expect(result.accent, `painted ${painted}`).toBe(fromStore?.accent);
      expect(result.properties, `painted ${painted}`).toEqual(
        fromStore
          ? {
              '--qh-glass-level': appearanceVariables(fromStore).glass,
              '--qh-blob-strength': appearanceVariables(fromStore).blobStrength,
            }
          : {},
      );
    }
  });
});
