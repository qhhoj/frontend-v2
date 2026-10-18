import { describe, expect, it } from 'vitest';
import { PALETTE_SCREENS } from '../admin-nav';
import type { AdminNavItem } from '../admin-nav';
import { matchScreens, steppedKey } from './admin-search';
import type { PaletteEntry } from './admin-search';

const items = [...PALETTE_SCREENS];
const LABELS: Partial<Record<string, string>> = {
  problems: 'Bài tập',
  judges: 'Máy chấm',
  organizationQuotas: 'Hạn mức tổ chức',
};
const labelOf = (item: AdminNavItem) => LABELS[item.id] ?? item.id;
const keysOf = (entries: PaletteEntry[]) => entries.map((entry) => entry.key);

describe('matchScreens', () => {
  it('lists every screen for an empty term', () => {
    expect(matchScreens(items, '', labelOf)).toHaveLength(items.length);
  });

  it('matches the title case-insensitively, composed or decomposed', () => {
    expect(keysOf(matchScreens(items, 'MÁY', labelOf))).toEqual(['screen-judges']);
    expect(keysOf(matchScreens(items, 'máy'.normalize('NFD'), labelOf))).toEqual(['screen-judges']);
  });

  it('matches the path, so an address fragment finds its screen', () => {
    expect(keysOf(matchScreens(items, 'quotas', labelOf))).toEqual(['screen-organizationQuotas']);
  });

  it('links each hit to its route by name', () => {
    const [hit] = matchScreens(items, 'Bài tập', labelOf);
    expect(hit).toMatchObject({ group: 'screens', to: { name: 'admin-problems' } });
  });
});

describe('steppedKey', () => {
  const entries = ['a', 'b', 'c'].map((key): PaletteEntry => ({
    key,
    group: 'screens',
    label: key,
    detail: null,
    to: '/',
  }));

  it('moves down and up, wrapping at both ends', () => {
    expect(steppedKey(entries, 'a', 1)).toBe('b');
    expect(steppedKey(entries, 'c', 1)).toBe('a');
    expect(steppedKey(entries, 'a', -1)).toBe('c');
  });

  it('starts at the first (down) or last (up) option when none is active', () => {
    expect(steppedKey(entries, null, 1)).toBe('a');
    expect(steppedKey(entries, 'gone', -1)).toBe('c');
  });

  it('has nothing to choose in an empty list', () => {
    expect(steppedKey([], null, 1)).toBeNull();
  });
});
