import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { stubMatchMedia } from '@/test/match-media';
import { useThemeStore } from './theme.store';

const appliedTheme = () => document.documentElement.dataset.theme;

describe('useThemeStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('applies the system theme on first visit and remembers the applied id', () => {
    stubMatchMedia({ light: true });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(document.documentElement.style.colorScheme).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-light');
  });

  it('applies a stored preference over the system scheme', () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    stubMatchMedia({ light: true });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('follows the system scheme while auto', async () => {
    const media = stubMatchMedia({ light: false });
    useThemeStore();
    media.setLight(true);
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
  });

  it('ignores system changes once a theme is chosen', async () => {
    const media = stubMatchMedia({ light: false });
    const store = useThemeStore();
    store.choose('dark');
    media.setLight(true);
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('switches at runtime and persists the choice', async () => {
    const store = useThemeStore();
    store.choose('light');
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-light');
  });

  it('renders a defined theme for a stored preference that no longer exists', () => {
    localStorage.setItem('qhhoj.theme', 'neon-retired');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('adopts an account theme without overwriting the browser preference', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
  });

  it('adopts an account theme without creating a browser preference', async () => {
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(localStorage.getItem('qhhoj.theme')).toBeNull();
  });

  it('keeps the pre-painted theme through init and adopt, with no repaint (legacy account: light, OS dark)', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    document.documentElement.dataset.theme = 'glass-light';
    stubMatchMedia({ light: false });
    const repaints = new MutationObserver(() => {});
    repaints.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(repaints.takeRecords()).toHaveLength(0);
    expect(appliedTheme()).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-light');
    expect(localStorage.getItem('qhhoj.theme')).toBeNull();
    repaints.disconnect();
  });

  it('keeps the cached theme at init until the account or the OS says otherwise', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    stubMatchMedia({ light: false });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('re-resolves from the OS when the system scheme changes while the cache is held', async () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    const media = stubMatchMedia({ light: true });
    useThemeStore();
    media.setLight(false);
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('ignores a cached id that is no longer registered', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'neon-retired');
    stubMatchMedia({ light: true });
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
  });

  it('prefers an explicit local choice over the cached theme', () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    localStorage.setItem('qhhoj.resolvedTheme', 'glass-light');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('drops the account theme on sign-out and returns to the local choice, then the OS', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('glass-dark');
  });

  it('falls back to the OS scheme on sign-out when there is no local choice', async () => {
    stubMatchMedia({ light: true });
    const store = useThemeStore();
    store.adopt('dark');
    await nextTick();
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('glass-light');
  });

  it('lets a user choice outrank the account theme', async () => {
    const store = useThemeStore();
    store.adopt('light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('glass-dark');
  });

  it('follows the theme into the theme-color meta tag', async () => {
    const meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.append(meta);
    const grounds: Record<string, string> = { 'glass-dark': '#111111', 'glass-light': '#eeeeee' };
    vi.stubGlobal('getComputedStyle', () => ({
      getPropertyValue: () => ` ${grounds[appliedTheme() ?? '']} `,
    }));
    const store = useThemeStore();
    expect(meta.content).toBe('#111111');
    store.choose('light');
    await nextTick();
    expect(meta.content).toBe('#eeeeee');
    meta.remove();
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
