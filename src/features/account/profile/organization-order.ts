/** A copy of `items` with the item at `index` swapped with its neighbour (`-1` up, `+1` down); unchanged at either end. */
export function moveItem<Item>(items: readonly Item[], index: number, offset: -1 | 1): Item[] {
  const moved = [...items];
  const target = index + offset;
  if (index < 0 || target < 0 || index >= items.length || target >= items.length) return moved;
  [moved[index], moved[target]] = [moved[target]!, moved[index]!];
  return moved;
}

export const withoutItem = <Item>(items: readonly Item[], index: number): Item[] =>
  items.filter((_item, position) => position !== index);
