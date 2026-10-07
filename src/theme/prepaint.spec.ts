import { describe, expect, it } from 'vitest';
import indexHtml from '/index.html?raw';
import { THEMES } from './registry';

const script = /<script>([\s\S]*?)<\/script>/.exec(indexHtml)![1]!;
const knownIds = [.../known = \[([^\]]*)\]/.exec(script)![1]!.matchAll(/'([\w-]+)'/g)].map(
  ([, id]) => id,
);
const firstThemeOf = (scheme: string) => THEMES.find((theme) => theme.scheme === scheme)!.id;

/** Runs the real inline script against a stand-in page. */
function prepaint({
  stored = null as string | null,
  light = false,
  storageThrows = false,
  mediaThrows = false,
}) {
  const root = { dataset: {} as Record<string, string> };
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
    { documentElement: root },
    localStorageStub,
    matchMediaStub,
  );
  return root.dataset.theme;
}

describe('pre-paint script in index.html', () => {
  it('allows exactly the registered themes', () => {
    expect([...knownIds].sort()).toEqual(THEMES.map((theme) => theme.id).sort());
  });

  it('paints the last applied theme whatever the OS says', () => {
    expect(prepaint({ stored: 'glass-light', light: false })).toBe('glass-light');
    expect(prepaint({ stored: 'glass-dark', light: true })).toBe('glass-dark');
  });

  it('falls back to the default theme of the OS scheme for a missing or retired id', () => {
    expect(prepaint({ stored: null, light: true })).toBe(firstThemeOf('light'));
    expect(prepaint({ stored: null, light: false })).toBe(firstThemeOf('dark'));
    expect(prepaint({ stored: 'neon-retired', light: true })).toBe(firstThemeOf('light'));
  });

  it('still follows the OS when storage is blocked', () => {
    expect(prepaint({ storageThrows: true, light: true })).toBe(firstThemeOf('light'));
  });

  it('paints dark when matchMedia is unavailable', () => {
    expect(prepaint({ mediaThrows: true })).toBe(firstThemeOf('dark'));
  });
});
