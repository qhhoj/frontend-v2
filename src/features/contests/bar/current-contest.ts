import type { CurrentParticipation } from '@/api/types/contests';

/** `participation.virtual`: 0 the live run, -1 a spectator, n ≥ 1 the nth virtual run. */
export type ParticipationKind = 'live' | 'virtual' | 'spectate';
export const participationKind = (virtual: number): ParticipationKind => {
  if (virtual < 0) return 'spectate';
  return virtual === 0 ? 'live' : 'virtual';
};

/**
 * The participation the viewer is taking part in at `now`: started (not merely registered) and not yet over. A
 * finished one stays in the cache until the next refetch, so the clock decides rather than the server's answer alone.
 */
export function activeParticipation(
  current: CurrentParticipation | null | undefined,
  now: number,
): CurrentParticipation | null {
  if (!current || current.participation.isRegistered) return null;
  return Date.parse(current.participation.endTime) > now ? current : null;
}
