import { VERDICT_TEXT_CLASSES } from './verdicts';

/** A rating change with its sign: "+42", "-7", "0". */
export const formatDelta = (delta: number): string => (delta > 0 ? `+${delta}` : String(delta));

/** Cue of a rating change: a gain is full, a loss zero, none (neutral) for no change or a first rating. */
export const deltaTone = (delta: number | null): 'full' | 'zero' | 'neutral' =>
  !delta ? 'neutral' : delta > 0 ? 'full' : 'zero';

/**
 * The colour of the signed number beside a rating: the change is the contest's result for that user, so a gain is the
 * accepted green and a loss the wrong red; no change and a first rating keep their ink.
 */
export const deltaTextClass = (delta: number | null): string =>
  !delta ? '' : VERDICT_TEXT_CLASSES[delta > 0 ? 'ac' : 'wa'];
