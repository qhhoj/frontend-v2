import { describe, expect, it } from 'vitest';
import { ref } from 'vue';
import type { OverviewTileSpec } from './overview-tiles';
import { useFrozenTileOrder } from './use-frozen-tile-order';

const tile = (
  key: string,
  needsAttention: boolean,
  value: OverviewTileSpec['value'],
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

describe('useFrozenTileOrder', () => {
  it('puts attention first while figures arrive, then keeps that order through later polls', () => {
    const tiles = ref([tile('queue', false, 0), tile('tickets', false, null)]);
    const order = useFrozenTileOrder(tiles);
    expect(keysOf(order.value)).toEqual(['queue', 'tickets']);

    tiles.value = [tile('queue', false, 0), tile('tickets', true, 3)];
    expect(keysOf(order.value)).toEqual(['tickets', 'queue']);

    // A poll flips which tile needs attention: figures update in place, positions do not move.
    tiles.value = [tile('queue', true, 5), tile('tickets', false, 0)];
    expect(keysOf(order.value)).toEqual(['tickets', 'queue']);
    expect(order.value.map((entry) => entry.value)).toEqual([0, 5]);
    expect(order.value.map((entry) => entry.needsAttention)).toEqual([false, true]);
  });

  it('keeps reordering while a figure is still loading', () => {
    const tiles = ref([tile('queue', false, 0), tile('tickets', false, null)]);
    const order = useFrozenTileOrder(tiles);
    tiles.value = [tile('queue', true, 2), tile('tickets', false, null)];
    expect(keysOf(order.value)).toEqual(['queue', 'tickets']);
    tiles.value = [tile('queue', false, 0), tile('tickets', true, null)];
    expect(keysOf(order.value)).toEqual(['tickets', 'queue']);
  });

  it('sends a tile that appears after the freeze to the end', () => {
    const tiles = ref([tile('queue', true, 1), tile('judges', false, '1/1')]);
    const order = useFrozenTileOrder(tiles);
    expect(keysOf(order.value)).toEqual(['queue', 'judges']);
    tiles.value = [tile('reports', true, 2), ...tiles.value];
    expect(keysOf(order.value)).toEqual(['queue', 'judges', 'reports']);
  });
});
