import { computed, ref, toValue } from 'vue';
import type { MaybeRefOrGetter } from 'vue';
import { readStorage, writeStorage } from '@/lib/storage';
import { useMediaQuery } from '@/lib/use-media-query';

const KEY = 'qhhoj.contest-rail-collapsed';
/** Below this width an open submit pane leaves the statement too narrow, so the rail starts collapsed. */
const NARROW_QUERY = '(max-width: 1599.98px)';

/** The viewer's saved choice: '1' collapsed, '0' expanded, null none yet. */
const saved = ref<string | null>(readStorage(KEY));

/**
 * Whether the contest problem rail shows as a narrow strip. Without a saved choice it collapses by default while the
 * submit pane is open on a screen narrower than 1600 px. Once the viewer toggles, the choice is kept per browser.
 */
export function useProblemRailCollapse(paneOpen: MaybeRefOrGetter<boolean>) {
  const isNarrowScreen = useMediaQuery(NARROW_QUERY);
  const isCollapsed = computed(() => {
    if (saved.value !== null) return saved.value === '1';
    return toValue(paneOpen) && isNarrowScreen.value;
  });
  const toggle = () => {
    saved.value = isCollapsed.value ? '0' : '1';
    writeStorage(KEY, saved.value);
  };
  return { isCollapsed, toggle };
}
