/** Medal colour of ranks 1 to 3; other ranks keep the body colour. */
export const medalClass = (rank: number) =>
  rank === 1
    ? 'font-bold text-medal-gold'
    : rank === 2
      ? 'font-bold text-medal-silver'
      : rank === 3
        ? 'font-bold text-medal-bronze'
        : '';
