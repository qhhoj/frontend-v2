import { translate } from '@/i18n';
import { RATING_TIERS } from '@/lib/rating-tiers';
import type { RatingTier } from '@/lib/rating-tiers';

/** Legacy `VNOJ_DISPLAY_RANKS`: the role shown beside a name; `banned` is set by a ban and cleared by the unban. */
export const DISPLAY_RANKS = [
  'user',
  'setter',
  'daor',
  'staff',
  'banned',
  'admin',
  'teacher',
] as const;
type DisplayRank = (typeof DISPLAY_RANKS)[number];

const isDisplayRank = (rank: string): rank is DisplayRank =>
  (DISPLAY_RANKS as readonly string[]).includes(rank);
const isRatingTier = (rank: string): rank is RatingTier =>
  (RATING_TIERS as readonly string[]).includes(rank);

/** A display rank in words; a rating tier name (old data) reads as the public tier label, anything else as stored. */
export function displayRankLabel(rank: string): string {
  if (isDisplayRank(rank)) return translate(`admin.users.ranks.${rank}`);
  if (isRatingTier(rank)) return translate(`tiers.${rank}`);
  return rank;
}

/** The users list's role cell for an account without a staff flag: a ban shows in the status column, so it reads as a member. */
export const memberRoleLabel = (rank: string): string =>
  displayRankLabel(rank === 'banned' ? 'user' : rank);
