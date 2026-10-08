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
