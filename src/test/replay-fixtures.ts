/* Relative imports only. */
import type { ContestDetail, ProblemCell, Ranking } from '../api/types/contests';
import type {
  LoadedGhost,
  LoadedReplay,
  ReplayChunk,
  ReplayEvent,
  ReplayParticipant,
  ReplayProblem,
} from '../api/types/replay';
import { contestDetail, ranking, rankingRow, RANKING_PROBLEM_IDS, sessionUser } from './fixtures';

const [PROBLEM_A, PROBLEM_B] = RANKING_PROBLEM_IDS;
export const REPLAY_BUILD_ID = '0192a000-0000-7000-8000-00000000b001';
/** r41 runs 08:00-11:00 UTC on 1 Oct 2026, no window: three hours. */
export const REPLAY_DURATION_SECONDS = 10_800;
export const VIRTUAL_PARTICIPATION_ID = 'part-01v';

/** An ended icpc contest without a freeze (its board is readable by anyone). */
export const endedContest = (overrides: Partial<ContestDetail> = {}): ContestDetail =>
  contestDetail({
    key: 'r41',
    name: 'QHH Round #41',
    phase: 'ended',
    formatName: 'icpc',
    startTime: '2026-10-01T08:00:00Z',
    endTime: '2026-10-01T11:00:00Z',
    timeLimit: null,
    frozenLastMinutes: 0,
    ...overrides,
  });

const participant = (
  participationId: string,
  username: string,
  userId?: string,
): ReplayParticipant => ({
  participationId,
  user: { id: userId ?? `${participationId}-user`, username, rating: null, organization: null },
});
/** user_01 is the signed-in viewer of `sessionUser()`; user_03 registered and never submitted. */
export const REPLAY_PARTICIPANTS: ReplayParticipant[] = [
  participant('part-07', 'user_07'),
  participant('part-12', 'user_12'),
  participant('part-01', 'user_01', sessionUser().id),
  participant('part-03', 'user_03'),
];
export const REPLAY_PROBLEMS: ReplayProblem[] = [
  { problemId: PROBLEM_A, code: 'r41a', label: 'A', points: 1 },
  { problemId: PROBLEM_B, code: 'r41b', label: 'B', points: 1 },
];
/** An icpc cell: `time` in seconds, `points` 0 or the problem's, `tries` including the solving one. */
export const icpcCell = (time: number, points: number, tries: number): ProblemCell => ({
  time,
  points,
  tries,
});
/** icpc `cumtime` is minutes plus 20 per wrong try before a solve (hand-derived below). */
export const REPLAY_EVENTS: ReplayEvent[] = [
  [300, 1, 0, icpcCell(300, 0, 1), 0, 0, 0],
  [540, 0, 0, icpcCell(540, 1, 1), 1, 9, 0],
  [720, 1, 0, icpcCell(720, 1, 2), 1, 32, 0],
  [1080, 2, 0, icpcCell(1080, 1, 1), 1, 18, 0],
  [1860, 0, 1, icpcCell(1860, 1, 1), 2, 40, 0],
  [2400, 2, 1, icpcCell(2400, 0, 1), 1, 18, 0],
];
export const REPLAY_GHOSTS: LoadedGhost[] = [
  {
    label: 'Ghost · HSG 2024 #1',
    caption: 'THPT chuyên A',
    isUnranked: false,
    gap: null,
    events: [
      [400, 0, 0, icpcCell(400, 1, 1), 1, 6, 0],
      [1900, 0, 1, icpcCell(1900, 1, 1), 2, 37, 0],
    ],
  },
  {
    label: 'Ghost · HSG 2024 #9',
    caption: '',
    isUnranked: true,
    gap: 'rejectedBefore',
    events: [],
  },
];
/** The board the backend stored for r41 at the end (real rows): what the replay must reproduce. */
export const R41_FINAL_STANDINGS = [
  { rank: 1, username: 'user_07', score: 2, cumtime: 40 },
  { rank: 2, username: 'user_01', score: 1, cumtime: 18 },
  { rank: 3, username: 'user_12', score: 1, cumtime: 32 },
  { rank: 4, username: 'user_03', score: 0, cumtime: 0 },
];

export const loadedReplay = (overrides: Partial<LoadedReplay> = {}): LoadedReplay => ({
  buildId: REPLAY_BUILD_ID,
  builtAt: '2026-10-01T11:10:00Z',
  participants: REPLAY_PARTICIPANTS,
  problems: REPLAY_PROBLEMS,
  ghosts: REPLAY_GHOSTS,
  events: REPLAY_EVENTS,
  ...overrides,
});

/** Chunk 0 of a one-chunk build, as the server sends it. */
export const replayChunk = (overrides: Partial<ReplayChunk> = {}): ReplayChunk => ({
  state: 'ready',
  buildId: REPLAY_BUILD_ID,
  builtAt: '2026-10-01T11:10:00Z',
  chunk: 0,
  chunkCount: 1,
  participants: REPLAY_PARTICIPANTS,
  problems: REPLAY_PROBLEMS,
  ghosts: REPLAY_GHOSTS,
  events: REPLAY_EVENTS,
  ...overrides,
});

export const buildingChunk = (): ReplayChunk => ({
  state: 'building',
  buildId: null,
  builtAt: null,
  chunk: 0,
  chunkCount: 0,
  participants: null,
  problems: null,
  ghosts: null,
  events: [],
});

/** r41's live board with the viewer's running virtual row (1 solve, 20 min) for the overlay. */
export const r41Ranking = (): Ranking =>
  ranking({
    frozen: false,
    rows: [
      rankingRow(1, 'part-07', 'user_07', 2, 40, {}),
      {
        ...rankingRow(2, VIRTUAL_PARTICIPATION_ID, 'user_01', 1, 20, {
          [PROBLEM_A]: icpcCell(1200, 1, 1),
        }),
        virtual: 1,
      },
    ],
  });
