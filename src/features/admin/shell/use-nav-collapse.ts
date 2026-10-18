import { ref } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { FOLDED_BY_DEFAULT } from './admin-nav';
import type { AdminNavGroup } from './admin-nav';

type GroupId = AdminNavGroup['id'];
/** Open or folded per group the viewer toggled; a group never toggled keeps its default. */
type FoldChoices = Partial<Record<GroupId, boolean>>;
const STORAGE_KEY = 'qhhoj.admin.navOpen';
/** Before the folded tools group: the list of folded group ids. Read once when the new key is still empty. */
const LEGACY_KEY = 'qhhoj.admin.navCollapsed';

/** The stored choices, ignoring anything that is not an object of booleans (an old or hand-edited value). */
export function parseFoldChoices(raw: string | null): FoldChoices {
  try {
    const value: unknown = JSON.parse(raw ?? '{}');
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(([, open]) => typeof open === 'boolean'),
    );
  } catch {
    return {};
  }
}

/** The old list of folded groups as choices, so a viewer's folds survive the new format. */
export function legacyFoldChoices(raw: string | null): FoldChoices {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    if (!Array.isArray(value)) return {};
    return Object.fromEntries(
      value.filter((id) => typeof id === 'string').map((id) => [id, false]),
    );
  } catch {
    return {};
  }
}

const storedChoices = (): FoldChoices => {
  const raw = readStorage(STORAGE_KEY);
  return raw === null ? legacyFoldChoices(readStorage(LEGACY_KEY)) : parseFoldChoices(raw);
};

/** Whether a group shows its items: the viewer's own choice, else open unless it is folded by default. */
export const isGroupOpen = (choices: FoldChoices, id: GroupId): boolean =>
  choices[id] ?? !FOLDED_BY_DEFAULT.includes(id);

/** Module-wide, so the side nav and the phone nav fold the same groups; remembered per browser. */
const choices = ref<FoldChoices>(storedChoices());

export function useNavCollapse() {
  const isOpen = (id: GroupId) => isGroupOpen(choices.value, id);
  const toggle = (id: GroupId) => {
    choices.value = { ...choices.value, [id]: !isOpen(id) };
    writeStorage(STORAGE_KEY, JSON.stringify(choices.value));
  };
  return { isOpen, toggle };
}
