import { readStorage, writeStorage } from '@/lib/storage';
import { hasLegacyAccent, parseAppearance } from './appearance';
import { CHOICE_KEY, PAINTED_KEY } from './appearance.store';
import { canonicalPreference, LEGACY_PREFERENCES } from './registry';
import { PREFERENCE_KEY, RESOLVED_BY_KEY, RESOLVED_KEY } from './theme.store';

const readJson = (key: string): unknown => {
  try {
    return JSON.parse(readStorage(key) ?? 'null');
  } catch {
    return null;
  }
};

/** Rewrites a stored Clay or Glass theme id to its successor; true when the visitor had chosen it. */
function migrateTheme(): boolean {
  const preference = readStorage(PREFERENCE_KEY);
  const resolved = readStorage(RESOLVED_KEY);
  const isLegacy = (id: string | null): id is string =>
    id !== null && Object.hasOwn(LEGACY_PREFERENCES, id);
  if (isLegacy(preference)) writeStorage(PREFERENCE_KEY, canonicalPreference(preference));
  if (isLegacy(resolved)) writeStorage(RESOLVED_KEY, canonicalPreference(resolved));
  // Every returning visitor has a Clay theme painted; only a Glass one an account chose was a choice.
  const accountChoseGlass =
    readStorage(RESOLVED_BY_KEY) === 'account' && resolved?.startsWith('glass-') === true;
  return isLegacy(preference) || accountChoseGlass;
}

/** Rewrites a stored look with a retired accent to the current shape; true when there was one. */
function migrateLook(key: string): boolean {
  const stored = readJson(key);
  if (!hasLegacyAccent(stored)) return false;
  writeStorage(key, JSON.stringify(parseAppearance(stored)));
  return true;
}

/**
 * Before the theme and appearance stores start: moves this browser's Clay or Glass choices (theme ids, the eight
 * accents) to palette A's, and answers whether the visitor had chosen any. Rewriting them makes the answer true once,
 * so main.ts tells the visitor once.
 */
export function migrateStoredLook(): boolean {
  const changed = [migrateTheme(), migrateLook(CHOICE_KEY), migrateLook(PAINTED_KEY)];
  return changed.some(Boolean);
}
