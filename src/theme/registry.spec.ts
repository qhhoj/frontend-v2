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
  it('turns a legacy value into the Clay id and leaves current and inherited-looking values alone', () => {
    expect(canonicalPreference('light')).toBe('clay-light');
    expect(canonicalPreference('dark')).toBe('clay-dark');
    for (const inherited of ['constructor', '__proto__', 'toString'])
      expect(canonicalPreference(inherited)).toBe(inherited);
    for (const value of [AUTO_THEME, GLASS_AUTO_THEME, ...THEMES.map((theme) => theme.id)])
      expect(canonicalPreference(value)).toBe(value);
  });
});
