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
