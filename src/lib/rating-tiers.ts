/** Legacy `judge/ratings.py` RATING_CLASS and RATING_VALUES. */
export const RATING_TIERS = [
  'newbie',
  'pupil',
  'specialist',
  'expert',
  'candidate-master',
  'master',
  'international-master',
  'grandmaster',
  'international-grandmaster',
  'legendary-grandmaster',
] as const;
export const TIER_LOWER_BOUNDS = [1200, 1400, 1600, 1900, 2200, 2300, 2400, 2600, 2900] as const;

export type RatingTier = (typeof RATING_TIERS)[number];
export type TierColor =
  | 'none'
  | 'newbie'
  | 'pupil'
  | 'specialist'
  | 'expert'
  | 'candidate-master'
  | 'master'
  | 'grandmaster';

export const ratingTier = (rating: number | null): RatingTier | null =>
  rating === null
    ? null
    : RATING_TIERS[TIER_LOWER_BOUNDS.filter((bound) => rating >= bound).length]!;

/** Legacy ranks.scss gives the master and grandmaster variants one colour each. */
export function tierColor(tier: RatingTier | null): TierColor {
  if (!tier) return 'none';
  if (tier === 'international-master') return 'master';
  if (tier.endsWith('grandmaster')) return 'grandmaster';
  return tier as TierColor;
}
