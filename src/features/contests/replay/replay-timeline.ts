import type { ProblemCell } from '@/api/types/contests';
import type { ReplayEvent, ReplayProblem } from '@/api/types/replay';
import { isPenaltyFormat, rankingCell } from '@/lib/ranking-cells';
import type { RankingContext } from '@/lib/ranking-cells';
import type { BoardRowIdentity, ReplayIndex, ReplayTrack } from './replay-board';
import { asRankingProblem, isSolvedCell } from './replay-cells';

export interface TimelineEntry {
  event: ReplayEvent;
  identity: BoardRowIdentity;
}
export interface FirstSolve {
  rowId: string;
  seconds: number;
}
/** A first solve drawn on the scrub track. */
export interface SolveMark {
  problemId: string;
  label: string;
  seconds: number;
  /** Position on the track, 0..100. */
  percent: number;
}
export interface FeedText {
  key: string;
  params: Record<string, string | number>;
}

export const RECENT_EVENT_COUNT = 5;

/** Every event of every row (ghosts included) in time order; built once per replay. */
export const timelineOf = (index: ReplayIndex): TimelineEntry[] =>
  index.tracks
    .flatMap((track) => track.events.map((event) => ({ event, identity: track.identity })))
    .sort((left, right) => left.event[0] - right.event[0]);

/** How many entries happen at or before `seconds` (binary search; the timeline is sorted). */
export function countUntil(timeline: readonly TimelineEntry[], seconds: number): number {
  let low = 0;
  let high = timeline.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (timeline[middle]!.event[0] <= seconds) low = middle + 1;
    else high = middle;
  }
  return low;
}

/** The latest `count` events at or before `seconds`, newest first. */
export function recentEvents(
  timeline: readonly TimelineEntry[],
  seconds: number,
  count = RECENT_EVENT_COUNT,
): TimelineEntry[] {
  const end = countUntil(timeline, seconds);
  return timeline.slice(Math.max(0, end - count), end).reverse();
}

/** Each problem's earliest solve in one track, at or before `seconds`. */
function solvesOf(
  track: ReplayTrack,
  problems: readonly ReplayProblem[],
  seconds: number,
  context: RankingContext,
): Map<string, number> {
  const solves = new Map<string, number>();
  for (const event of track.events) {
    if (event[0] > seconds) break;
    const problem = problems[event[2]];
    if (problem && !solves.has(problem.problemId) && isSolvedCell(event[3], problem, context))
      solves.set(problem.problemId, event[0]);
  }
  return solves;
}

/** Who solved each problem first among real rows (ghosts never take the star); an earlier participant wins a same-second tie. */
export function firstSolvesUntil(
  index: ReplayIndex,
  seconds: number,
  context: RankingContext,
): Map<string, FirstSolve> {
  const firstSolves = new Map<string, FirstSolve>();
  for (const track of index.tracks.filter((candidate) => candidate.identity.kind === 'real'))
    for (const [problemId, solvedAt] of solvesOf(track, index.problems, seconds, context)) {
      const best = firstSolves.get(problemId);
      if (!best || solvedAt < best.seconds)
        firstSolves.set(problemId, { rowId: track.identity.id, seconds: solvedAt });
    }
  return firstSolves;
}

/** The green dots of the scrub track: each problem's first real solve over the whole replay. */
export function firstSolveMarks(
  index: ReplayIndex,
  durationSeconds: number,
  context: RankingContext,
): SolveMark[] {
  const firstSolves = firstSolvesUntil(index, Number.POSITIVE_INFINITY, context);
  return index.problems.flatMap((problem) => {
    const solve = firstSolves.get(problem.problemId);
    if (!solve) return [];
    const percent = Math.min(100, (solve.seconds / Math.max(durationSeconds, 1)) * 100);
    return [
      { problemId: problem.problemId, label: problem.label, seconds: solve.seconds, percent },
    ];
  });
}

/** The feed line of one event, read through the ranking's own cell rules. */
export function feedTextOf(
  cell: ProblemCell,
  problem: ReplayProblem,
  context: RankingContext,
): FeedText {
  const view = rankingCell(cell, asRankingProblem(problem), '', context);
  const label = problem.label;
  if (view.kind === 'solved' || view.kind === 'first-solve')
    return { key: 'replay.feed.solved', params: { problem: label } };
  if (view.kind === 'failed' && isPenaltyFormat(context.formatName))
    return {
      key: 'replay.feed.failed',
      params: { problem: label, tries: Number(view.labelParams.tries ?? 0) },
    };
  if (view.kind === 'partial' || view.kind === 'failed')
    return { key: 'replay.feed.points', params: { problem: label, points: view.text } };
  return { key: 'replay.feed.submitted', params: { problem: label } };
}
