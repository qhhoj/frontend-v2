import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { stubMatchMedia } from '@/test/match-media';
import { MORE_CONTRAST_QUERY } from './appearance';
import { useAppearanceStore } from './appearance.store';

const HIGH = { accent: 'ultramarine', contrast: 'high', background: 'contour' } as const;
const PLAIN = { accent: 'teal', contrast: 'standard', background: 'none' } as const;
const root = document.documentElement;

beforeEach(() => setActivePinia(createPinia()));

describe('appearance store', () => {
  it('applies a chosen look at once and remembers it for this browser and for the pre-paint script', () => {
    const store = useAppearanceStore();
    store.choose(HIGH);
    expect(root.dataset.accent).toBe('ultramarine');
    expect(root.dataset.background).toBe('contour');
    expect(root.dataset.contrast).toBe('high');
    expect(JSON.parse(localStorage.getItem('qhhoj.appearance')!)).toEqual(HIGH);
    expect(JSON.parse(localStorage.getItem('qhhoj.paintedAppearance')!)).toEqual(HIGH);
  });

  it.each(['not json', '{"accent":"violet"}', '{"contrast":"high"}', '"x"'])(
    'reads a stored look that is not valid (%s) as the site look',
    (stored) => {
      localStorage.setItem('qhhoj.appearance', stored);
      localStorage.setItem('qhhoj.paintedAppearance', stored);
      const store = useAppearanceStore();
      expect(store.look).toBeNull();
      expect(root.dataset.accent).toBeUndefined();
    },
  );

  it('paints the default background (blueprint) for the site look and for a stored look that has none', () => {
    const store = useAppearanceStore();
    expect(store.look).toBeNull();
    expect(root.dataset.background).toBe('blueprint');
    store.choose(HIGH);
    store.adopt(null);
    expect(root.dataset.background).toBe('blueprint');
    const old = '{"accent":"mint","glass":10,"glow":20}';
    localStorage.setItem('qhhoj.appearance', old);
    localStorage.setItem('qhhoj.paintedAppearance', old);
    setActivePinia(createPinia());
    expect(useAppearanceStore().look).toEqual({
      accent: 'teal',
      contrast: 'standard',
      background: 'blueprint',
    });
  });

  it('follows the device contrast without a look, and the look own contrast with one', () => {
    const media = stubMatchMedia();
    media.setQuery(MORE_CONTRAST_QUERY, true);
    const store = useAppearanceStore();
    expect(root.dataset.contrast).toBe('high');
    expect(store.shown.contrast).toBe('high');
    store.choose(PLAIN);
    expect(root.dataset.contrast).toBeUndefined();
    store.choose(null);
    media.setQuery(MORE_CONTRAST_QUERY, false);
    expect(root.dataset.contrast).toBeUndefined();
  });

  it("lets the account's look outrank this browser's, and null mean the site look", () => {
    const store = useAppearanceStore();
    store.choose(PLAIN);
    store.adopt(HIGH);
    expect(store.look).toEqual(HIGH);
    expect(root.dataset.accent).toBe('ultramarine');
    store.adopt(null);
    expect(store.look).toBeNull();
    expect(root.dataset.accent).toBeUndefined();
  });

  it("hands back to this browser's look on sign-out (adopt undefined)", () => {
    const store = useAppearanceStore();
    store.choose(PLAIN);
    store.adopt(HIGH);
    store.adopt(undefined);
    expect(store.look).toEqual(PLAIN);
  });

  it('keeps the pre-painted look until the account, this browser or a choice speaks', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(HIGH));
    localStorage.setItem('qhhoj.appearance', JSON.stringify(PLAIN));
    const store = useAppearanceStore();
    expect(store.look).toEqual(HIGH);
    expect(root.dataset.accent).toBe('ultramarine');
    store.adopt(undefined);
    expect(store.look).toEqual(PLAIN);
  });

  it('writes the painted copy when the account look is the first thing to speak', () => {
    const store = useAppearanceStore();
    store.adopt(HIGH);
    expect(JSON.parse(localStorage.getItem('qhhoj.paintedAppearance')!)).toEqual(HIGH);
  });

  it('writes the painted copy once, with the final look, when adopting over a held painted look', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(PLAIN));
    const store = useAppearanceStore();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    store.adopt(HIGH);
    expect(write.mock.calls.filter(([key]) => key === 'qhhoj.paintedAppearance')).toEqual([
      ['qhhoj.paintedAppearance', JSON.stringify(HIGH)],
    ]);
    write.mockRestore();
  });

  it('writes the painted copy once, with the final look, when choosing over a held painted look', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(PLAIN));
    localStorage.setItem('qhhoj.appearance', JSON.stringify(HIGH));
    const store = useAppearanceStore();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    store.choose(PLAIN);
    expect(write.mock.calls.filter(([key]) => key === 'qhhoj.paintedAppearance')).toEqual([
      ['qhhoj.paintedAppearance', JSON.stringify(PLAIN)],
    ]);
    write.mockRestore();
  });
});
