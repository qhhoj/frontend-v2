/**
 * The text colour of an acceptance rate (percent, 0 to 100): low acceptance means a hard problem, high an easy one. It reuses the
 * rating-tier colours (green, teal, blue, orange, red), which are solved for contrast in both themes. A rate of 0 has no
 * colour: nobody has solved it, so it says nothing about difficulty.
 */
const RAMP = [
  { from: 50, text: 'text-tier-pupil' },
  { from: 30, text: 'text-tier-specialist' },
  { from: 15, text: 'text-tier-expert' },
  { from: 5, text: 'text-tier-master' },
  { from: 0, text: 'text-tier-grandmaster' },
] as const;

export const acRateTextClass = (rate: number): string =>
  rate <= 0 ? 'text-muted' : (RAMP.find((step) => rate >= step.from)?.text ?? 'text-muted');
