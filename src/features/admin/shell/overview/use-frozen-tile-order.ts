import { computed } from 'vue';
import type { Ref } from 'vue';
import { attentionFirst, inOrder, isFullyLoaded } from './overview-tiles';
import type { OverviewTileSpec } from './overview-tiles';

/**
 * The dashboard's tile order: attention first while the figures arrive, then, from the first read with every figure
 * loaded, that very order for good. Later polls change a tile's figure and attention mark in place, never its position,
 * so a tile never moves from under the pointer.
 */
export function useFrozenTileOrder(tiles: Ref<OverviewTileSpec[]>) {
  // Set once, by the first read that finds every figure loaded.
  let frozenKeys: string[] | null = null;
  return computed(() => {
    const current = tiles.value;
    if (!frozenKeys && isFullyLoaded(current)) {
      frozenKeys = attentionFirst(current).map((tile) => tile.key);
    }
    return frozenKeys ? inOrder(current, frozenKeys) : attentionFirst(current);
  });
}
