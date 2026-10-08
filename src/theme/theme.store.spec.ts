import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { stubMatchMedia } from '@/test/match-media';
import { useThemeStore } from './theme.store';

const appliedTheme = () => document.documentElement.dataset.theme;

describe('useThemeStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('applies the system theme on first visit and remembers the applied id', () => {
    stubMatchMedia({ dark: true });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-dark');
  });

  it('is Clay light when the system has no preference', () => {
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
    expect(document.documentElement.style.colorScheme).toBe('light');
  });

  it('is Clay light in a browser without matchMedia', () => {
    vi.stubGlobal('matchMedia', undefined);
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
  });

  it('applies a stored legacy preference over the system scheme, on Clay', () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('applies a stored Glass preference by id', () => {
    localStorage.setItem('qhhoj.theme', 'glass-dark');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('follows the system scheme within Glass for a stored glass-auto, live', async () => {
    localStorage.setItem('qhhoj.theme', 'glass-auto');
    const media = stubMatchMedia({ dark: true });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-dark');
    media.setDark(false);
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
  });

  it('follows the system scheme while auto', async () => {
    const media = stubMatchMedia({ dark: false });
    useThemeStore();
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('ignores system changes once a theme is chosen', async () => {
    const media = stubMatchMedia({ dark: true });
    const store = useThemeStore();
    store.choose('dark');
    media.setDark(false);
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('switches at runtime and persists the choice', async () => {
    const store = useThemeStore();
    store.choose('glass-dark');
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
    expect(localStorage.getItem('qhhoj.theme')).toBe('glass-dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-dark');
  });

  it('switches to glass-auto at runtime, persists it and follows the system', async () => {
    const media = stubMatchMedia({ dark: false });
    const store = useThemeStore();
    store.choose('glass-auto');
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('glass-auto');
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('renders a defined theme for a stored preference that no longer exists', () => {
    localStorage.setItem('qhhoj.theme', 'neon-retired');
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
  });

  it('adopts an account theme without overwriting the browser preference', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
  });

  it('adopts an account glass-auto by the system scheme', async () => {
    stubMatchMedia({ dark: true });
    const store = useThemeStore();
    store.adopt('glass-auto');
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('adopts an account theme without creating a browser preference', async () => {
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(localStorage.getItem('qhhoj.theme')).toBeNull();
  });

  it('keeps the pre-painted theme through init and adopt, with no repaint (legacy account: light, OS dark)', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'clay-light');
    document.documentElement.dataset.theme = 'clay-light';
    stubMatchMedia({ dark: true });
    const repaints: MutationRecord[] = [];
    const observer = new MutationObserver((records) => repaints.push(...records));
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    repaints.push(...observer.takeRecords());
    expect(repaints).toHaveLength(0);
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.theme')).toBeNull();
    observer.disconnect();
  });

  it('keeps the cached theme at init until the account or the OS says otherwise', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('keeps a cached Glass theme for a stored glass-auto, with no repaint', () => {
    localStorage.setItem('qhhoj.theme', 'glass-auto');
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    document.documentElement.dataset.theme = 'glass-light';
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('keeps a cached Clay theme for a stored glass-auto until the account or the OS says otherwise', () => {
    localStorage.setItem('qhhoj.theme', 'glass-auto');
    localStorage.setItem('qhhoj.resolvedTheme', 'clay-light');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
  });

  it('re-resolves from the OS when the system scheme changes while the cache is held', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    const media = stubMatchMedia({ dark: false });
    useThemeStore();
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('ignores a cached id that is no longer registered', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'neon-retired');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
  });

  it('keeps the cached theme over an explicit local choice at start-up, until a choice is made', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    const store = useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('adopts the account theme that is already painted with no repaint, whatever the local choice', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    document.documentElement.dataset.theme = 'glass-light';
    const repaints: MutationRecord[] = [];
    const observer = new MutationObserver((records) => repaints.push(...records));
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const store = useThemeStore();
    store.adopt('glass-light');
    await nextTick();
    repaints.push(...observer.takeRecords());
    observer.disconnect();
    expect(repaints).toHaveLength(0);
    expect(appliedTheme()).toBe('glass-light');
  });

  it('drops the account theme on sign-out and returns to the local choice, then the OS', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-dark');
  });

  it('falls back to the OS scheme on sign-out when there is no local choice', async () => {
    stubMatchMedia({ dark: false });
    const store = useThemeStore();
    store.adopt('dark');
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
  });

  it('lets a user choice outrank the account theme', async () => {
    const store = useThemeStore();
    store.adopt('light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('follows the theme into the theme-color meta tag', async () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
    try {
      const grounds: Record<string, string> = { 'clay-light': '#eeeeee', 'clay-dark': '#111111' };
      vi.stubGlobal('getComputedStyle', () => ({
        getPropertyValue: () => ` ${grounds[appliedTheme() ?? '']} `,
      }));
      const store = useThemeStore();
      expect(meta.content).toBe('#eeeeee');
      store.choose('dark');
      await nextTick();
      expect(meta.content).toBe('#111111');
    } finally {
      meta.remove();
    }
  });

  it('applies the account theme over a held cache and rewrites the cache', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
  });

  it('resolves from the OS when sign-out arrives while the cache is held', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-dark');
    stubMatchMedia({ dark: false });
    const store = useThemeStore();
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
  });

  it('exposes the account theme as the selected preference while signed in', () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    expect(store.preference).toBe('dark');
    store.adopt('light');
    expect(store.preference).toBe('light');
    store.adopt(null);
    expect(store.preference).toBe('dark');
  });

  it('treats a stored auto preference as no explicit choice for the cache hold', () => {
    localStorage.setItem('qhhoj.theme', 'auto');
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    stubMatchMedia({ dark: true });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
  });

  it('stops listening to the system scheme when disposed', () => {
    const subscribed = new Set<unknown>();
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: (_type: string, listener: unknown) => subscribed.add(listener),
      removeEventListener: (_type: string, listener: unknown) => subscribed.delete(listener),
    }));
    const store = useThemeStore();
    expect(subscribed.size).toBe(1);
    store.$dispose();
    expect(subscribed.size).toBe(0);
  });
});
