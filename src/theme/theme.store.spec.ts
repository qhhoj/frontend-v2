import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import { stubMatchMedia } from '@/test/match-media';
import { useThemeStore } from './theme.store';

const appliedTheme = () => document.documentElement.dataset.theme;
const paintedByAccount = (id: string) => {
  localStorage.setItem('qhhoj.resolvedTheme', id);
  localStorage.setItem('qhhoj.resolvedBy', 'account');
};

describe('useThemeStore', () => {
  beforeEach(() => setActivePinia(createPinia()));

  it('applies the system theme on first visit and remembers the applied id', () => {
    stubMatchMedia({ dark: true });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-dark');
  });

  it('applies a stored legacy preference over the system scheme, on Clay', () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-dark');
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

  it('adopts an account theme without overwriting the browser preference', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
  });

  it('keeps the pre-painted theme through init and adopt, with no repaint (legacy account: light, OS dark)', async () => {
    paintedByAccount('clay-light');
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
    paintedByAccount('glass-light');
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('keeps a cached Glass theme for a stored glass-auto, with no repaint', () => {
    localStorage.setItem('qhhoj.theme', 'glass-auto');
    paintedByAccount('glass-light');
    document.documentElement.dataset.theme = 'glass-light';
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('re-resolves from the OS when the system scheme changes while the cache is held', async () => {
    paintedByAccount('glass-light');
    const media = stubMatchMedia({ dark: false });
    useThemeStore();
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('resolves a locally painted cache by the OS today: auto follows the current scheme', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'clay-dark');
    localStorage.setItem('qhhoj.resolvedBy', 'local');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
  });

  it('marks what it paints: account after adopt, local after sign-out or a choice', async () => {
    const store = useThemeStore();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
    store.adopt('glass-dark');
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('account');
    store.adopt(null);
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
    store.adopt('glass-dark');
    store.choose('clay-dark');
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
  });

  it('keeps the cached theme over an explicit local choice at start-up, until a choice is made', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    paintedByAccount('glass-light');
    const store = useThemeStore();
    expect(appliedTheme()).toBe('glass-light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('adopts the account theme that is already painted with no repaint, whatever the local choice', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    paintedByAccount('glass-light');
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

  it('lets a user choice outrank the account theme', async () => {
    const store = useThemeStore();
    store.adopt('light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('clay-dark');
  });

  it('applies the account theme over a held cache and rewrites the cache', async () => {
    paintedByAccount('glass-dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
  });

  it('resolves from the OS when sign-out arrives while the cache is held', async () => {
    paintedByAccount('glass-dark');
    stubMatchMedia({ dark: false });
    const store = useThemeStore();
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('clay-light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('clay-light');
  });
});
