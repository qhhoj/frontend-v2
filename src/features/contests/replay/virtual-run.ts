import type { CurrentParticipation, ParticipationSummary } from '@/api/types/contests';

const MS_PER_SECOND = 1000;

/** The viewer's own virtual run of this contest while it lasts; live runs, spectating, other contests and finished runs give null. */
export function virtualRunOf(
  current: CurrentParticipation | null | undefined,
  contestKey: string,
  nowMs: number,
): ParticipationSummary | null {
  if (!current || current.contest.key !== contestKey) return null;
  const { participation } = current;
  if (participation.virtual < 1 || nowMs >= Date.parse(participation.endTime)) return null;
  return participation;
}

/** Whole seconds since the run started, kept inside the replay's length. */
export const elapsedSeconds = (realStart: string, nowMs: number, durationSeconds: number): number =>
  Math.min(
    Math.max(Math.floor((nowMs - Date.parse(realStart)) / MS_PER_SECOND), 0),
    durationSeconds,
  );
