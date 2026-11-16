/** Medal colour of ranks 1 to 3; other ranks keep the body colour. */
export const medalClass = (rank: number) =>
  rank === 1
    ? 'font-bold text-medal-gold'
    : rank === 2
      ? 'font-bold text-medal-silver'
      : rank === 3
        ? 'font-bold text-medal-bronze'
        : '';

/** A filled badge for ranks 1 to 3 (medal colour behind the digit); other ranks get none. */
export const medalBadgeClass = (rank: number) =>
  rank === 1
    ? 'bg-medal-gold text-surface-solid'
    : rank === 2
      ? 'bg-medal-silver text-surface-solid'
      : rank === 3
        ? 'bg-medal-bronze text-surface-solid'
        : 'text-muted';

/** Pill shape for a rank badge in a table cell; pair with `medalBadgeClass` for the fill. */
export const MEDAL_BADGE_SHAPE =
  'inline-flex h-6 min-w-6 items-center justify-center rounded-pill px-1.5 font-bold';
