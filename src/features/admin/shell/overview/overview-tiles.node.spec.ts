import { describe, expect, it } from 'vitest';
import { attentionFirst } from './overview-tiles';
import type { OverviewTileSpec } from './overview-tiles';

const tile = (key: string, needsAttention: boolean): OverviewTileSpec => ({
  key,
  icon: {},
  label: key,
  value: 0,
  to: '/',
  needsAttention,
  linkText: key,
});
const keysOf = (tiles: OverviewTileSpec[]) => tiles.map((entry) => entry.key);

describe('attentionFirst', () => {
  it('moves the tiles that need attention ahead of the rest, keeping each part in order', () => {
    const tiles = [
      tile('queue', false),
      tile('judges', false),
      tile('tickets', true),
      tile('reports', false),
      tile('requests', true),
    ];
    expect(keysOf(attentionFirst(tiles))).toEqual([
      'tickets',
      'requests',
      'queue',
      'judges',
      'reports',
    ]);
  });

  it('keeps the given order when nothing or everything needs attention', () => {
    const calm = [tile('queue', false), tile('judges', false)];
    expect(keysOf(attentionFirst(calm))).toEqual(['queue', 'judges']);
    const busy = [tile('queue', true), tile('judges', true)];
    expect(keysOf(attentionFirst(busy))).toEqual(['queue', 'judges']);
  });
});
