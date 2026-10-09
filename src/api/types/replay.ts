import type { Schemas } from '../schemas';
import type { ProblemCell } from './contests';

/** backend: contests/replay/dto/replay.dto.ts (ReplayResponse). `state: 'building'` arrives with HTTP 202 and empty lists. */
export type ReplayChunk = Schemas['ReplayResponse'];
/** backend: ReplayParticipantResponse; at the position of its `participantIndex`. */
export type ReplayParticipant = Schemas['ReplayParticipantResponse'];
/** backend: ReplayProblemResponse; at the position of its `problemIndex`. */
export type ReplayProblem = Schemas['ReplayProblemResponse'];
/** backend: ReplayGhostResponse; its events carry its position in `ghosts` as `participantIndex`. */
export type ReplayGhost = Schemas['ReplayGhostResponse'];
/** backend: libs/contests ghost-gap.ts GHOST_GAPS. */
export type GhostGap = Schemas['GhostGap'];

/**
 * @uiOnly The document types an event as `(number | object)[]`; this is the fixed order of backend `ReplayEvent`
 * (libs/contests replay-events.ts), narrowed by `asReplayEvent`.
 */
export type ReplayEvent = [
  seconds: number,
  participantIndex: number,
  problemIndex: number,
  cell: ProblemCell,
  score: number,
  cumtime: number,
  tiebreaker: number,
];
/** @uiOnly A ghost whose events are narrowed. */
export type LoadedGhost = Omit<ReplayGhost, 'events'> & { events: ReplayEvent[] };
/** @uiOnly Every chunk of one build joined; what the page plays. */
export interface LoadedReplay {
  buildId: string;
  builtAt: string;
  participants: ReplayParticipant[];
  problems: ReplayProblem[];
  ghosts: LoadedGhost[];
  /** Real rows only, sorted by seconds (backend `mergeEvents`). */
  events: ReplayEvent[];
}
/** @uiOnly What one replay read gives the page: still building, or the joined build. */
export type ReplayLoad = { state: 'building' } | { state: 'ready'; replay: LoadedReplay };
