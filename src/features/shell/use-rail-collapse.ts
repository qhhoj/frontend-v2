import { ref } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';

const KEY = 'qhhoj.rail-collapsed';
/** From this width the full rail shows (`rail-open` in styles.css); narrower, the rail is always the icon column. */
export const RAIL_WIDE_QUERY = '(min-width: 68.75rem)';

/**
 * Whether the viewer collapsed the public rail to its icon column, kept per browser (default: expanded). It is read when
 * this module loads, before the shell first renders, so a collapsed rail never flashes open.
 */
const isCollapsed = ref(readStorage(KEY) === '1');

export function useRailCollapse() {
  const toggle = () => {
    isCollapsed.value = !isCollapsed.value;
    writeStorage(KEY, isCollapsed.value ? '1' : '0');
  };
  return { isCollapsed, toggle };
}
