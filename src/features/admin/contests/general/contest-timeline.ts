/** The moments on the time section's bar, in the order they happen. */
export type TimelineKey = 'registrationStart' | 'start' | 'freeze' | 'end' | 'lockedAfter';

export interface TimelinePoint {
  key: TimelineKey;
  /** An ISO instant. */
  at: string;
  /** Where it sits on the bar, 0 (left) to 1 (right). */
  position: number;
}

export interface Timeline {
  points: TimelinePoint[];
  /** The contest run (start to end) and the frozen stretch, as bar fractions; `freeze` is null without a freeze. */
  run: { from: number; to: number };
  freeze: { from: number; to: number } | null;
}

export interface TimelineInput {
  registrationStart: string | null;
  startTime: string | null;
  endTime: string | null;
  lockedAfter: string | null;
  frozenLastMinutes: number;
}

const MINUTE_MS = 60_000;
const timeOf = (iso: string | null) => (iso ? Date.parse(iso) : Number.NaN);

/**
 * The bar above the date fields: registration, start, freeze, end and judging lock placed by time between the earliest and
 * the latest of them. Null until start and end are both set, with end after start.
 */
export function timelineOf(input: TimelineInput): Timeline | null {
  const start = timeOf(input.startTime);
  const end = timeOf(input.endTime);
  if (!(end > start)) return null;
  const freezeMinutes = Number.isFinite(input.frozenLastMinutes) ? input.frozenLastMinutes : 0;
  const freeze = freezeMinutes > 0 ? Math.max(start, end - freezeMinutes * MINUTE_MS) : null;
  const moments: [TimelineKey, number][] = [
    ['registrationStart', timeOf(input.registrationStart)],
    ['start', start],
    ['freeze', freeze ?? Number.NaN],
    ['end', end],
    ['lockedAfter', timeOf(input.lockedAfter)],
  ];
  const known = moments.filter(([, at]) => Number.isFinite(at));
  const first = Math.min(...known.map(([, at]) => at));
  const span = Math.max(...known.map(([, at]) => at)) - first;
  const positionOf = (at: number) => (at - first) / span;
  return {
    points: known
      .map(([key, at]) => ({ key, at: new Date(at).toISOString(), position: positionOf(at) }))
      .sort((left, right) => left.position - right.position),
    run: { from: positionOf(start), to: positionOf(end) },
    freeze: freeze === null ? null : { from: positionOf(freeze), to: positionOf(end) },
  };
}
