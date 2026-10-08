import { describe, expect, it } from 'vitest';
import indexHtml from '/index.html?raw';
import { THEMES } from './registry';

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

/** Runs the real inline script against a stand-in page. */
function prepaint({
  stored = null as string | null,
  light = false,
  storageThrows = false,
  mediaThrows = false,
}) {
  const root = { dataset: {} as Record<string, string> };
  const themeColor = {
    content: '',
    setAttribute: (_name: string, value: string) => (themeColor.content = value),
  };
  const localStorageStub = {
    getItem: () => {
      if (storageThrows) throw new Error('storage blocked');
      return stored;
    },
  };
  const matchMediaStub = () => {
    if (mediaThrows) throw new Error('no matchMedia');
    return { matches: light };
  };
  // The script is the page's own source under test, so evaluating it here is the point.
  // eslint-disable-next-line @typescript-eslint/no-implied-eval
  new Function('document', 'localStorage', 'matchMedia', script)(
    { documentElement: root, querySelector: () => themeColor },
    localStorageStub,
    matchMediaStub,
  );
  return { theme: root.dataset.theme, themeColor: themeColor.content };
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
    expect(prepaint({ stored: 'glass-light', light: false }).theme).toBe('glass-light');
    expect(prepaint({ stored: 'glass-dark', light: true }).theme).toBe('glass-dark');
  });

  it('falls back to the default theme of the OS scheme for a missing or retired id', () => {
    expect(prepaint({ stored: null, light: true }).theme).toBe(firstThemeOf('light'));
    expect(prepaint({ stored: null, light: false }).theme).toBe(firstThemeOf('dark'));
    expect(prepaint({ stored: 'neon-retired', light: true }).theme).toBe(firstThemeOf('light'));
  });

  it('still follows the OS when storage is blocked', () => {
    expect(prepaint({ storageThrows: true, light: true }).theme).toBe(firstThemeOf('light'));
  });

  it('paints dark when matchMedia is unavailable', () => {
    expect(prepaint({ mediaThrows: true }).theme).toBe(firstThemeOf('dark'));
  });
});
