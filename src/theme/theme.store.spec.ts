import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
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
});
