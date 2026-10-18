import type { Component } from 'vue';
import type { RouteLocationRaw } from 'vue-router';

/** One dashboard figure, as `OverviewTile` takes it; `key` keeps a tile's DOM node when the order changes. */
export interface OverviewTileSpec {
  key: string;
  icon: Component;
  label: string;
  value: string | number | null;
  detail?: string;
  to: RouteLocationRaw;
  needsAttention?: boolean;
  linkText: string;
}

/** The tiles that need attention first (UX barem: priority first), then the rest; each part keeps its given order. */
export const attentionFirst = (tiles: readonly OverviewTileSpec[]): OverviewTileSpec[] => [
  ...tiles.filter((tile) => tile.needsAttention),
  ...tiles.filter((tile) => !tile.needsAttention),
];

/** Every figure has arrived (a `null` value is one still loading or failed): the moment the order can be settled. */
export const isFullyLoaded = (tiles: readonly OverviewTileSpec[]): boolean =>
  tiles.length > 0 && tiles.every((tile) => tile.value !== null);

/** The tiles in the order of `keys`; a tile `keys` does not know goes last, in its given order. */
export const inOrder = (
  tiles: readonly OverviewTileSpec[],
  keys: readonly string[],
): OverviewTileSpec[] => {
  const rank = (tile: OverviewTileSpec) => {
    const index = keys.indexOf(tile.key);
    return index === -1 ? keys.length : index;
  };
  return [...tiles].sort((left, right) => rank(left) - rank(right));
};
