/**
 * The rank mark of the board. Gold is merit and nothing else: first place is a gold disc, second a gold ring, third a
 * plain ring; every other rank is a number.
 */
const MEDAL_SHAPE = 'inline-flex size-6 items-center justify-center rounded-pill font-bold';
const MEDALS: Record<number, string> = {
  1: 'bg-merit text-ground',
  2: 'text-merit ring-2 ring-merit ring-inset',
  3: 'text-secondary ring-2 ring-line-strong ring-inset',
};
export const rankMedalClass = (rank: number | null, isDisqualified: boolean): string => {
  const medal = rank !== null && !isDisqualified ? MEDALS[rank] : undefined;
  return medal ? `${MEDAL_SHAPE} ${medal}` : '';
};
