import { describe, expect, it } from 'vitest';
import {
  AUTO_THEME,
  canonicalPreference,
  GLASS_AUTO_THEME,
  resolveTheme,
  THEMES,
} from './registry';

describe('resolveTheme', () => {
  it('follows the system scheme for auto and lands on Clay', () => {
    expect(resolveTheme(AUTO_THEME, 'dark').id).toBe('clay-dark');
    expect(resolveTheme(AUTO_THEME, 'light').id).toBe('clay-light');
  });

  it('follows the system scheme for glass-auto and lands on Glass', () => {
    expect(resolveTheme(GLASS_AUTO_THEME, 'dark').id).toBe('glass-dark');
    expect(resolveTheme(GLASS_AUTO_THEME, 'light').id).toBe('glass-light');
  });

  it('maps the legacy siteTheme values light and dark onto Clay whatever the system says', () => {
    expect(resolveTheme('light', 'dark').id).toBe('clay-light');
    expect(resolveTheme('dark', 'light').id).toBe('clay-dark');
  });

  it('accepts a theme id, Glass included, whatever the system says', () => {
    expect(resolveTheme('glass-light', 'dark').id).toBe('glass-light');
    expect(resolveTheme('glass-dark', 'light').id).toBe('glass-dark');
    expect(resolveTheme('clay-dark', 'light').id).toBe('clay-dark');
    expect(resolveTheme('clay-light', 'dark').id).toBe('clay-light');
  });

  it('falls back to the Clay theme of the system scheme for an unknown preference', () => {
    expect(resolveTheme('neon-retired', 'light').id).toBe('clay-light');
    expect(resolveTheme('', 'dark').id).toBe('clay-dark');
  });
});

describe('canonicalPreference', () => {
  it('turns a legacy value into the Clay id and leaves the current values alone', () => {
    expect(canonicalPreference('light')).toBe('clay-light');
    expect(canonicalPreference('dark')).toBe('clay-dark');
    for (const value of [AUTO_THEME, GLASS_AUTO_THEME, ...THEMES.map((theme) => theme.id)])
      expect(canonicalPreference(value)).toBe(value);
  });
});

describe('THEMES', () => {
  it('has unique ids and a theme for each scheme', () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    expect(new Set(THEMES.map((theme) => theme.scheme))).toEqual(new Set(['dark', 'light']));
  });

  it('keeps the auto preferences apart from theme ids', () => {
    for (const auto of [AUTO_THEME, GLASS_AUTO_THEME])
      expect(THEMES.some((theme) => theme.id === auto)).toBe(false);
  });

  it('makes the first theme of each scheme flat and keeps a Glass theme in each', () => {
    for (const scheme of ['dark', 'light'] as const) {
      expect(THEMES.find((theme) => theme.scheme === scheme)?.glass).toBe(false);
      expect(THEMES.some((theme) => theme.scheme === scheme && theme.glass)).toBe(true);
    }
  });

  it('saves every preference as a value the backend accepts', () => {
    for (const value of [AUTO_THEME, GLASS_AUTO_THEME, ...THEMES.map((theme) => theme.id)])
      expect(value).toMatch(/^[a-z][a-z0-9-]{0,31}$/);
  });
});
