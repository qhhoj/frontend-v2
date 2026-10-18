import { describe, expect, it } from 'vitest';
import { attentionFirst, inOrder, isFullyLoaded } from './overview-tiles';
import type { OverviewTileSpec } from './overview-tiles';

const tile = (
  key: string,
  needsAttention: boolean,
  value: OverviewTileSpec['value'] = 0,
): OverviewTileSpec => ({
  key,
  icon: {},
  label: key,
  value,
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

describe('isFullyLoaded', () => {
  it('is true once no figure is still loading, a zero and a text value included', () => {
    expect(isFullyLoaded([tile('queue', false, 0), tile('judges', false, '2/3')])).toBe(true);
  });

  it('is false while a figure is loading, and with no tiles at all', () => {
    expect(isFullyLoaded([tile('queue', false, 4), tile('judges', false, null)])).toBe(false);
    expect(isFullyLoaded([])).toBe(false);
  });
});

describe('inOrder', () => {
  it('follows the given keys whatever the tiles say now', () => {
    const tiles = [tile('queue', true), tile('judges', false), tile('tickets', true)];
    expect(keysOf(inOrder(tiles, ['judges', 'tickets', 'queue']))).toEqual([
      'judges',
      'tickets',
      'queue',
    ]);
  });

  it('puts a tile the keys do not know last, and skips a key with no tile', () => {
    const tiles = [tile('new', true), tile('queue', false), tile('late', false)];
    expect(keysOf(inOrder(tiles, ['gone', 'queue']))).toEqual(['queue', 'new', 'late']);
  });
});
