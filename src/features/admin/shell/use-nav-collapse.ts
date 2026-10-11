import { ref } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import type { AdminNavGroup } from './admin-nav';

type GroupId = AdminNavGroup['id'];
const STORAGE_KEY = 'qhhoj.admin.navCollapsed';

/** The stored ids, ignoring anything that is not a list of strings (an old or hand-edited value). */
export function parseCollapsed(raw: string | null): GroupId[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is GroupId => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

/** Module-wide, so the side nav and the phone nav fold the same groups; remembered per browser. */
const collapsed = ref<GroupId[]>(parseCollapsed(readStorage(STORAGE_KEY)));

export function useNavCollapse() {
  const isOpen = (id: GroupId) => !collapsed.value.includes(id);
  const toggle = (id: GroupId) => {
    collapsed.value = isOpen(id)
      ? [...collapsed.value, id]
      : collapsed.value.filter((other) => other !== id);
    writeStorage(STORAGE_KEY, JSON.stringify(collapsed.value));
  };
  return { isOpen, toggle };
}
