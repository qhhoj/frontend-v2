import { describe, expect, it } from 'vitest';
import { AUTO_THEME, canonicalPreference, resolveTheme, THEMES } from './registry';

describe('resolveTheme', () => {
  it('follows the system scheme for auto and for an unknown preference', () => {
    expect(resolveTheme(AUTO_THEME, 'dark').id).toBe('dark');
    expect(resolveTheme(AUTO_THEME, 'light').id).toBe('light');
    expect(resolveTheme('neon-retired', 'light').id).toBe('light');
    expect(resolveTheme('', 'dark').id).toBe('dark');
  });

  it('keeps a chosen mode whatever the system says, a Clay or Glass id included', () => {
    expect(resolveTheme('light', 'dark').id).toBe('light');
    expect(resolveTheme('dark', 'light').id).toBe('dark');
    expect(resolveTheme('glass-dark', 'light').id).toBe('dark');
    expect(resolveTheme('clay-light', 'dark').id).toBe('light');
    expect(resolveTheme('glass-auto', 'dark').id).toBe('dark');
  });
});

describe('canonicalPreference', () => {
  it('turns a Clay or Glass id into its successor and leaves current and inherited-looking values alone', () => {
    expect(canonicalPreference('clay-dark')).toBe('dark');
    expect(canonicalPreference('glass-light')).toBe('light');
    expect(canonicalPreference('glass-auto')).toBe(AUTO_THEME);
    for (const value of [
      'constructor',
      '__proto__',
      'toString',
      AUTO_THEME,
      ...THEMES.map((theme) => theme.id),
    ])
      expect(canonicalPreference(value)).toBe(value);
  });
});
