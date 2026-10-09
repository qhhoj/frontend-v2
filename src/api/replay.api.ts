import { ApiError } from './client';
import { apiGet, apiSend } from './typed';
import type { ProblemCell } from './types/contests';
import type { LoadedReplay, ReplayChunk, ReplayEvent, ReplayLoad } from './types/replay';

/** One chunk; `build` pins every chunk after the first to the build chunk 0 named. */
export const fetchReplayChunk = (
  key: string,
  chunk: number,
  build?: string,
): Promise<ReplayChunk> =>
  apiGet('/contests/{key}/replay', { path: { key }, query: { chunk, build } });

const isNumber = (value: unknown): value is number => typeof value === 'number';
const isCell = (value: unknown): value is ProblemCell =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The wire tuple, checked: a malformed event is the server's fault and must never be drawn. */
export function asReplayEvent(raw: readonly unknown[]): ReplayEvent {
  const [seconds, participantIndex, problemIndex, cell, score, cumtime, tiebreaker] = raw;
  const hasNumbers =
    raw.length === 7 &&
    [seconds, participantIndex, problemIndex, score, cumtime, tiebreaker].every(isNumber);
  if (!hasNumbers || !isCell(cell))
    throw new ApiError('invalid_response', 200, 'Malformed replay event');
  return [
    Number(seconds),
    Number(participantIndex),
    Number(problemIndex),
    cell,
    Number(score),
    Number(cumtime),
    Number(tiebreaker),
  ];
}

const isReplayChanged = (error: unknown) =>
  error instanceof ApiError && error.code === 'replay_changed';

/** Chunks 1..count-1 of one build, asked together. */
const laterChunks = (key: string, count: number, buildId: string): Promise<ReplayChunk[]> =>
  Promise.all(
    Array.from({ length: Math.max(count - 1, 0) }, (_unused, offset) =>
      fetchReplayChunk(key, offset + 1, buildId),
    ),
  );

function joinChunks(first: ReplayChunk, buildId: string, rest: ReplayChunk[]): LoadedReplay {
  return {
    buildId,
    builtAt: first.builtAt ?? '',
    participants: first.participants ?? [],
    problems: first.problems ?? [],
    ghosts: (first.ghosts ?? []).map((ghost) => ({
      ...ghost,
      events: ghost.events.map(asReplayEvent),
    })),
    events: [first, ...rest].flatMap((chunk) => chunk.events.map(asReplayEvent)),
  };
}

async function loadBuild(key: string): Promise<ReplayLoad> {
  const first = await fetchReplayChunk(key, 0);
  if (first.state === 'building' || first.buildId === null) return { state: 'building' };
  const rest = await laterChunks(key, first.chunkCount, first.buildId);
  return { state: 'ready', replay: joinChunks(first, first.buildId, rest) };
}

/** Every chunk of the current build. A rebuild during the read restarts it once from chunk 0; a second one is an error. */
export async function loadReplay(key: string): Promise<ReplayLoad> {
  try {
    return await loadBuild(key);
  } catch (error) {
    if (!isReplayChanged(error)) throw error;
    return loadBuild(key);
  }
}

/** Editors; ended contests only. Answers 202 `{ queued: true }`. */
export const rebuildReplay = (key: string) =>
  apiSend('post', '/contests/{key}/replay/rebuild', { path: { key } });
