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
    expect(appliedTheme()).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('dark');
  });

  it('applies a stored Clay or Glass preference as its successor, over the system scheme', () => {
    localStorage.setItem('qhhoj.theme', 'glass-dark');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('dark');
  });

  it('follows the system scheme while auto', async () => {
    const media = stubMatchMedia({ dark: false });
    useThemeStore();
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('dark');
  });

  it('ignores system changes once a theme is chosen', async () => {
    const media = stubMatchMedia({ dark: true });
    const store = useThemeStore();
    store.choose('dark');
    media.setDark(false);
    await nextTick();
    expect(appliedTheme()).toBe('dark');
  });

  it('switches at runtime and persists the choice', async () => {
    const store = useThemeStore();
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('dark');
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('dark');
  });

  it('adopts an account theme without overwriting the browser preference', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
  });

  it('keeps the pre-painted theme through init and adopt, with no repaint (legacy account: light, OS dark)', async () => {
    paintedByAccount('light');
    document.documentElement.dataset.theme = 'light';
    stubMatchMedia({ dark: true });
    const repaints: MutationRecord[] = [];
    const observer = new MutationObserver((records) => repaints.push(...records));
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    repaints.push(...observer.takeRecords());
    expect(repaints).toHaveLength(0);
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
    expect(localStorage.getItem('qhhoj.theme')).toBeNull();
    observer.disconnect();
  });

  it('keeps the cached theme at init until the account or the OS says otherwise', () => {
    paintedByAccount('light');
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('keeps the cached account theme for a stored glass-auto, with no repaint', () => {
    localStorage.setItem('qhhoj.theme', 'glass-auto');
    paintedByAccount('light');
    document.documentElement.dataset.theme = 'light';
    stubMatchMedia({ dark: true });
    const write = vi.spyOn(Storage.prototype, 'setItem');
    useThemeStore();
    expect(appliedTheme()).toBe('light');
    expect(write).not.toHaveBeenCalled();
    write.mockRestore();
  });

  it('re-resolves from the OS when the system scheme changes while the cache is held', async () => {
    paintedByAccount('light');
    const media = stubMatchMedia({ dark: false });
    useThemeStore();
    media.setDark(true);
    await nextTick();
    expect(appliedTheme()).toBe('dark');
  });

  it('resolves a locally painted cache by the OS today: auto follows the current scheme', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'dark');
    localStorage.setItem('qhhoj.resolvedBy', 'local');
    stubMatchMedia({ dark: false });
    useThemeStore();
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
  });

  it('marks what it paints: account after adopt, local after sign-out or a choice', async () => {
    const store = useThemeStore();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
    store.adopt('dark');
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('account');
    store.adopt(null);
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
    store.adopt('dark');
    store.choose('dark');
    await nextTick();
    expect(localStorage.getItem('qhhoj.resolvedBy')).toBe('local');
  });

  it('keeps the cached theme over an explicit local choice at start-up, until a choice is made', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    paintedByAccount('light');
    const store = useThemeStore();
    expect(appliedTheme()).toBe('light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('dark');
  });

  it('adopts the account theme that is already painted with no repaint, whatever the local choice', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    paintedByAccount('light');
    document.documentElement.dataset.theme = 'light';
    const repaints: MutationRecord[] = [];
    const observer = new MutationObserver((records) => repaints.push(...records));
    observer.observe(document.documentElement, { attributeFilter: ['data-theme'] });
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    repaints.push(...observer.takeRecords());
    observer.disconnect();
    expect(repaints).toHaveLength(0);
    expect(appliedTheme()).toBe('light');
  });

  it('drops the account theme on sign-out and returns to the local choice, then the OS', async () => {
    localStorage.setItem('qhhoj.theme', 'dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('light');
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('dark');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('dark');
  });

  it('lets a user choice outrank the account theme', async () => {
    const store = useThemeStore();
    store.adopt('light');
    store.choose('dark');
    await nextTick();
    expect(appliedTheme()).toBe('dark');
  });

  it('applies the account theme over a held cache and rewrites the cache', async () => {
    paintedByAccount('dark');
    const store = useThemeStore();
    store.adopt('light');
    await nextTick();
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
  });

  it('resolves from the OS when sign-out arrives while the cache is held', async () => {
    paintedByAccount('dark');
    stubMatchMedia({ dark: false });
    const store = useThemeStore();
    store.adopt(null);
    await nextTick();
    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
  });
});
