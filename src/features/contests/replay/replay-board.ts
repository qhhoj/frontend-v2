import type { ProblemCell, RankingProblem, RankingRow } from '@/api/types/contests';
import type { LoadedReplay, ReplayEvent, ReplayProblem } from '@/api/types/replay';
import type { RankingContext } from '@/lib/ranking-cells';
import { isSolvedCell } from './replay-cells';
import { firstSolvesUntil } from './replay-timeline';

export type BoardRowKind = 'real' | 'virtual' | 'ghost';

/** Who a row is; never changes while the clock moves. */
export interface BoardRowIdentity {
  /** The participation id, or `ghost-<position>`. */
  id: string;
  kind: BoardRowKind;
  /** Username, or the ghost's label. */
  name: string;
  /** The ghost's caption; empty for people. */
  caption: string;
  /** Null for ghosts. */
  userId: string | null;
  /** The person's rating (null: unrated or a ghost); colours the name. */
  rating: number | null;
  /** A ghost the server could not score: listed last, no rank, no cells. */
  isUnranked: boolean;
  /** Position inside its class (participant index, ghost position): the last tie order. */
  order: number;
}
/** One row of the board at one second. */
export interface BoardRow extends BoardRowIdentity {
  rank: number | null;
  score: number;
  cumtime: number;
  tiebreaker: number;
  /** Keyed by problem id. */
  cells: Record<string, ProblemCell>;
  /**
   * Compared by identity: the same object while the row's cells and totals are unchanged (the last event applied, the track
   * before any, the ranking row of a virtual row). Lets the table skip redrawing a row that did not move.
   */
  revision: object;
}
/** A row and its own events, sorted by seconds. */
export interface ReplayTrack {
  identity: BoardRowIdentity;
  events: ReplayEvent[];
}
export interface ReplayIndex {
  problems: ReplayProblem[];
  tracks: ReplayTrack[];
}
export interface ReplayBoard {
  problems: RankingProblem[];
  rows: BoardRow[];
}

/** Inside a tie: real rows, then the viewer's virtual row (spec 3.3), then ghosts (B5: real before ghost). */
const KIND_ORDER: Record<BoardRowKind, number> = { real: 0, virtual: 1, ghost: 2 };

function realTracks(replay: LoadedReplay): ReplayTrack[] {
  const tracks: ReplayTrack[] = replay.participants.map((participant, order) => ({
    identity: {
      id: participant.participationId,
      kind: 'real',
      name: participant.user.username,
      caption: '',
      userId: participant.user.id,
      rating: participant.user.rating,
      isUnranked: false,
      order,
    },
    events: [],
  }));
  for (const event of replay.events) tracks[event[1]]?.events.push(event);
  return tracks;
}

const ghostTracks = (replay: LoadedReplay): ReplayTrack[] =>
  replay.ghosts.map((ghost, order) => ({
    identity: {
      id: `ghost-${order}`,
      kind: 'ghost',
      name: ghost.label,
      caption: ghost.caption,
      userId: null,
      rating: null,
      isUnranked: ghost.isUnranked,
      order,
    },
    events: ghost.events,
  }));

/** Groups the events by row once; every later board is read from this. */
export const indexReplay = (replay: LoadedReplay): ReplayIndex => ({
  problems: replay.problems,
  tracks: [...realTracks(replay), ...ghostTracks(replay)],
});

/** The row after every event at or before `seconds`; the last event of an instant wins. */
export function rowAt(
  track: ReplayTrack,
  problems: readonly ReplayProblem[],
  seconds: number,
): BoardRow {
  const cells: Record<string, ProblemCell> = {};
  let totals = { score: 0, cumtime: 0, tiebreaker: 0 };
  let revision: object = track;
  for (const event of track.events) {
    if (event[0] > seconds) break;
    const problem = problems[event[2]];
    if (problem) cells[problem.problemId] = event[3];
    totals = { score: event[4], cumtime: event[5], tiebreaker: event[6] };
    revision = event;
  }
  return { ...track.identity, rank: null, ...totals, cells, revision };
}

/** Backend `compareStandings` (score desc, cumtime asc, tiebreaker asc), unranked last, then the class and position. */
export const compareRows = (left: BoardRow, right: BoardRow): number =>
  Number(left.isUnranked) - Number(right.isUnranked) ||
  right.score - left.score ||
  left.cumtime - right.cumtime ||
  left.tiebreaker - right.tiebreaker ||
  KIND_ORDER[left.kind] - KIND_ORDER[right.kind] ||
  left.order - right.order;

const isTied = (left: BoardRow, right: BoardRow) =>
  left.score === right.score &&
  left.cumtime === right.cumtime &&
  left.tiebreaker === right.tiebreaker;

/** Sorted, with backend `competitionRanks`: tied rows share a rank and the next rank skips (1, 1, 3). */
export function rankRows(rows: readonly BoardRow[]): BoardRow[] {
  const ranked: BoardRow[] = [];
  [...rows].sort(compareRows).forEach((row, position) => {
    const previous = ranked[position - 1];
    const sharesRank = previous !== undefined && previous.rank !== null && isTied(previous, row);
    const rank = row.isUnranked ? null : sharesRank ? previous.rank : position + 1;
    ranked.push({ ...row, rank });
  });
  return ranked;
}

function problemsAt(
  index: ReplayIndex,
  rows: readonly BoardRow[],
  seconds: number,
  context: RankingContext,
): RankingProblem[] {
  const firstSolves = firstSolvesUntil(index, seconds, context);
  const realRows = rows.filter((row) => row.kind === 'real');
  return index.problems.map((problem) => ({
    ...problem,
    firstSolve: firstSolves.get(problem.problemId)?.rowId ?? null,
    acceptedCount: realRows.filter((row) =>
      isSolvedCell(row.cells[problem.problemId], problem, context),
    ).length,
  }));
}

/** The whole board at `seconds` (from each participation's own start), plus rows from elsewhere (the live virtual row). */
export function boardAt(
  index: ReplayIndex,
  seconds: number,
  context: RankingContext,
  extraRows: readonly BoardRow[] = [],
): ReplayBoard {
  const rows = rankRows([
    ...index.tracks.map((track) => rowAt(track, index.problems, seconds)),
    ...extraRows,
  ]);
  return { problems: problemsAt(index, rows, seconds, context), rows };
}

/** The viewer's live virtual row from the ranking, as a board row. */
export const virtualRowOf = (row: RankingRow): BoardRow => ({
  id: row.participationId,
  kind: 'virtual',
  name: row.user.username,
  caption: '',
  userId: row.user.id,
  rating: row.user.rating,
  isUnranked: false,
  order: 0,
  rank: null,
  score: row.score,
  cumtime: row.cumtime,
  tiebreaker: row.tiebreaker,
  cells: row.cells,
  revision: row,
});
