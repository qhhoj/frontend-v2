import { ratingTier, tierColor } from './rating-tiers';
import type { TierColor } from './rating-tiers';

/** The text colour class of each rating tier's username (the tokens are `--color-tier-*`). */
export const TIER_TEXT_CLASSES: Record<TierColor, string> = {
  none: 'text-tier-none',
  newbie: 'text-tier-newbie',
  pupil: 'text-tier-pupil',
  specialist: 'text-tier-specialist',
  expert: 'text-tier-expert',
  'candidate-master': 'text-tier-candidate-master',
  master: 'text-tier-master',
  grandmaster: 'text-tier-grandmaster',
};

/** SVG fill of each tier. Written out in full so Tailwind sees every class; a built `fill-tier-${name}` is never generated. */
export const TIER_FILL_CLASSES: Record<TierColor, string> = {
  none: 'fill-tier-none',
  newbie: 'fill-tier-newbie',
  pupil: 'fill-tier-pupil',
  specialist: 'fill-tier-specialist',
  expert: 'fill-tier-expert',
  'candidate-master': 'fill-tier-candidate-master',
  master: 'fill-tier-master',
  grandmaster: 'fill-tier-grandmaster',
};
/** SVG stroke of each tier (written out in full for the same reason as the fills). */
export const TIER_STROKE_CLASSES: Record<TierColor, string> = {
  none: 'stroke-tier-none',
  newbie: 'stroke-tier-newbie',
  pupil: 'stroke-tier-pupil',
  specialist: 'stroke-tier-specialist',
  expert: 'stroke-tier-expert',
  'candidate-master': 'stroke-tier-candidate-master',
  master: 'stroke-tier-master',
  grandmaster: 'stroke-tier-grandmaster',
};
/** Colour class of a username: undefined rating (not known) keeps the body colour, null (unrated) the unrated tier colour. */
export const ratingTextClass = (rating: number | null | undefined): string =>
  rating === undefined ? 'text-content' : TIER_TEXT_CLASSES[tierColor(ratingTier(rating))];
