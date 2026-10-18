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
