import { describe, expect, it } from 'vitest';
import { AUTO_THEME, resolveTheme, THEMES } from './registry';

describe('resolveTheme', () => {
  it('follows the system scheme for auto', () => {
    expect(resolveTheme(AUTO_THEME, 'dark').id).toBe('glass-dark');
    expect(resolveTheme(AUTO_THEME, 'light').id).toBe('glass-light');
  });

  it('maps the backend siteTheme values onto the Glass themes whatever the system says', () => {
    expect(resolveTheme('light', 'dark').id).toBe('glass-light');
    expect(resolveTheme('dark', 'light').id).toBe('glass-dark');
  });

  it('accepts a theme id', () => {
    expect(resolveTheme('glass-light', 'dark').id).toBe('glass-light');
  });

  it('falls back to the system theme for an unknown preference', () => {
    expect(resolveTheme('neon-retired', 'light').id).toBe('glass-light');
    expect(resolveTheme('', 'dark').id).toBe('glass-dark');
  });

  it('has unique ids and stored values, and a theme for each scheme', () => {
    expect(new Set(THEMES.map((theme) => theme.id)).size).toBe(THEMES.length);
    expect(new Set(THEMES.map((theme) => theme.storedAs)).size).toBe(THEMES.length);
    expect(THEMES.some((theme) => theme.storedAs === AUTO_THEME)).toBe(false);
    expect(new Set(THEMES.map((theme) => theme.scheme))).toEqual(new Set(['dark', 'light']));
  });
});
