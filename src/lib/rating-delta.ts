/** A rating change with its sign: "+42", "-7", "0". */
export const formatDelta = (delta: number): string => (delta > 0 ? `+${delta}` : String(delta));

/** Text colour of a rating change: gains positive, losses negative, none plain. */
export const deltaToneClass = (delta: number | null): string =>
  !delta ? 'text-content' : delta > 0 ? 'text-positive' : 'text-negative';
