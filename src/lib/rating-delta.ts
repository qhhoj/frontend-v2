/** A rating change with its sign: "+42", "-7", "0". */
export const formatDelta = (delta: number): string => (delta > 0 ? `+${delta}` : String(delta));

/** Cue of a rating change: a gain is full, a loss zero, none (neutral) for no change or a first rating. */
export const deltaTone = (delta: number | null): 'full' | 'zero' | 'neutral' =>
  !delta ? 'neutral' : delta > 0 ? 'full' : 'zero';
