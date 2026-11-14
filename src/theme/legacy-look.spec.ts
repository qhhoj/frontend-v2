import { describe, expect, it } from 'vitest';
import { migrateStoredLook } from './legacy-look';

describe('migrateStoredLook', () => {
  it('moves a chosen Clay or Glass look to palette A once, so the visitor is told once', () => {
    localStorage.setItem('qhhoj.theme', 'glass-dark');
    localStorage.setItem(
      'qhhoj.appearance',
      JSON.stringify({ accent: 'orchid', glass: 40, glow: 60 }),
    );
    expect(migrateStoredLook()).toBe(true);
    expect(localStorage.getItem('qhhoj.theme')).toBe('dark');
    expect(JSON.parse(localStorage.getItem('qhhoj.appearance')!)).toMatchObject({ accent: 'plum' });
    expect(migrateStoredLook()).toBe(false);
  });

  it('rewrites a painted Clay theme silently: every returning visitor has one', () => {
    localStorage.setItem('qhhoj.resolvedTheme', 'clay-light');
    localStorage.setItem('qhhoj.resolvedBy', 'local');
    expect(migrateStoredLook()).toBe(false);
    expect(localStorage.getItem('qhhoj.resolvedTheme')).toBe('light');
  });
});
