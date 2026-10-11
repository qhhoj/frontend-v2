import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAppearanceStore } from './appearance.store';

const OCEAN = { accent: 'ocean', glass: 40, glow: 60 } as const;
const MINT = { accent: 'mint', glass: 10, glow: 20 } as const;
const root = document.documentElement;

beforeEach(() => setActivePinia(createPinia()));

describe('appearance store', () => {
  it('applies a chosen look at once and remembers it for this browser and for the pre-paint script', () => {
    const store = useAppearanceStore();
    store.choose(OCEAN);
    expect(root.dataset.accent).toBe('ocean');
    expect(root.style.getPropertyValue('--qh-glass-level')).toBe('40');
    expect(root.style.getPropertyValue('--qh-blob-strength')).toBe('0.6');
    expect(JSON.parse(localStorage.getItem('qhhoj.appearance')!)).toEqual(OCEAN);
    expect(JSON.parse(localStorage.getItem('qhhoj.paintedAppearance')!)).toEqual(OCEAN);
  });

  it.each([
    'not json',
    '{"accent":"violet","glass":1,"glow":1}',
    '{"accent":"mint","glass":5.5,"glow":1}',
    '"x"',
  ])('reads a stored look that is not valid (%s) as the site look', (stored) => {
    localStorage.setItem('qhhoj.appearance', stored);
    localStorage.setItem('qhhoj.paintedAppearance', stored);
    const store = useAppearanceStore();
    expect(store.look).toBeNull();
    expect(root.dataset.accent).toBeUndefined();
  });

  it("lets the account's look outrank this browser's, and null mean the site look", () => {
    const store = useAppearanceStore();
    store.choose(MINT);
    store.adopt(OCEAN);
    expect(store.look).toEqual(OCEAN);
    expect(root.dataset.accent).toBe('ocean');
    store.adopt(null);
    expect(store.look).toBeNull();
    expect(root.dataset.accent).toBeUndefined();
  });

  it("hands back to this browser's look on sign-out (adopt undefined)", () => {
    const store = useAppearanceStore();
    store.choose(MINT);
    store.adopt(OCEAN);
    store.adopt(undefined);
    expect(store.look).toEqual(MINT);
  });

  it('keeps the pre-painted look until the account, this browser or a choice speaks', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(OCEAN));
    localStorage.setItem('qhhoj.appearance', JSON.stringify(MINT));
    const store = useAppearanceStore();
    expect(store.look).toEqual(OCEAN);
    expect(root.dataset.accent).toBe('ocean');
    store.adopt(undefined);
    expect(store.look).toEqual(MINT);
  });

  it('writes the painted copy when the account look is the first thing to speak', () => {
    const store = useAppearanceStore();
    store.adopt(OCEAN);
    expect(JSON.parse(localStorage.getItem('qhhoj.paintedAppearance')!)).toEqual(OCEAN);
  });

  it('writes the painted copy once, with the final look, when adopting over a held painted look', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(MINT));
    const store = useAppearanceStore();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    store.adopt(OCEAN);
    expect(write.mock.calls.filter(([key]) => key === 'qhhoj.paintedAppearance')).toEqual([
      ['qhhoj.paintedAppearance', JSON.stringify(OCEAN)],
    ]);
    write.mockRestore();
  });

  it('writes the painted copy once, with the final look, when choosing over a held painted look', () => {
    localStorage.setItem('qhhoj.paintedAppearance', JSON.stringify(MINT));
    localStorage.setItem('qhhoj.appearance', JSON.stringify(OCEAN));
    const store = useAppearanceStore();
    const write = vi.spyOn(Storage.prototype, 'setItem');
    store.choose(MINT);
    expect(write.mock.calls.filter(([key]) => key === 'qhhoj.paintedAppearance')).toEqual([
      ['qhhoj.paintedAppearance', JSON.stringify(MINT)],
    ]);
    write.mockRestore();
  });
});
