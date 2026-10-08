import { describe, expect, it } from 'vitest';
import { moveItem, withoutItem } from './organization-order';

describe('moveItem', () => {
  it('swaps an item with its neighbour', () => {
    expect(moveItem(['a', 'b', 'c'], 1, -1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'c', 'b']);
  });

  it('leaves the order alone at either end, and never touches the input', () => {
    const items = ['a', 'b'];
    expect(moveItem(items, 0, -1)).toEqual(['a', 'b']);
    expect(moveItem(items, 1, 1)).toEqual(['a', 'b']);
    expect(items).toEqual(['a', 'b']);
  });
});

describe('withoutItem', () => {
  it('drops exactly the item at the index', () => {
    expect(withoutItem(['a', 'b', 'a'], 2)).toEqual(['a', 'b']);
  });
});
