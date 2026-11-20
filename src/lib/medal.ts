/**
 * The marks of a top-three rank, the one place a rank takes a colour. Gold is merit and nothing else: there is no silver
 * and no bronze.
 */
const MEDAL_SHAPE = 'inline-flex size-6 items-center justify-center rounded-pill font-bold';
const MEDALS: Record<number, string> = {
  1: 'bg-merit text-ground',
  2: 'text-merit ring-2 ring-merit ring-inset',
  3: 'text-secondary ring-2 ring-line-strong ring-inset',
};

/**
 * The rank mark of a board cell: first place is a gold disc, second a gold ring, third a plain ring; every other rank
 * (and a disqualified row) is a plain number. Merit needs a score above zero: on a board where nobody has scored, every
 * row is "rank 1" and none of them gets a medal.
 */
export const rankMedalClass = (
  rank: number | null,
  score: number,
  isDisqualified = false,
): string => {
  const medal = rank !== null && score > 0 && !isDisqualified ? MEDALS[rank] : undefined;
  return medal ? `${MEDAL_SHAPE} ${medal}` : '';
};

/** A rank written in a line of text ("#2"): bold gold for the top three, the body colour for every other rank. */
export const medalClass = (rank: number): string =>
  rank >= 1 && rank <= 3 ? 'font-bold text-merit' : '';
