/** Tile colours: the eight tag tokens, so every theme styles them. Literal class names keep Tailwind's scanner happy. */
const TILE_CLASSES = [
  'bg-tag-1-bg text-tag-1',
  'bg-tag-2-bg text-tag-2',
  'bg-tag-3-bg text-tag-3',
  'bg-tag-4-bg text-tag-4',
  'bg-tag-5-bg text-tag-5',
  'bg-tag-6-bg text-tag-6',
  'bg-tag-7-bg text-tag-7',
  'bg-tag-8-bg text-tag-8',
] as const;

/** The same slug always gets the same colour (a small string hash, no storage). */
export function tileClass(slug: string): string {
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.codePointAt(0)!) >>> 0;
  return TILE_CLASSES[hash % TILE_CLASSES.length]!;
}

/** Up to two capitals from the name's words ("Đội tuyển Quốc Học Huế" -> "ĐT"); the short name when the name has none. */
export function initialsOf(name: string, shortName: string): string {
  const letters = name
    .split(/\s+/)
    .filter((word) => /[\p{L}\p{N}]/u.test(word))
    .slice(0, 2)
    .map((word) => word.match(/[\p{L}\p{N}]/u)![0].toUpperCase())
    .join('');
  return letters || shortName.slice(0, 2).toUpperCase();
}

/** Ranks by performance points, highest first; ties share the rank of the first of them. */
export function rankByPoints<T extends { performancePoints: number }>(
  items: T[],
): { item: T; rank: number }[] {
  const sorted = [...items].sort((left, right) => right.performancePoints - left.performancePoints);
  return sorted.map((item) => {
    const first = sorted.findIndex((other) => other.performancePoints === item.performancePoints);
    return { item, rank: first + 1 };
  });
}
