import { endedContest, r41Ranking, replayChunk } from '../../src/test/replay-fixtures';
import { ok } from './reply';
import type { Handler } from './reply';

/** The ended contest r41 with a ready replay (real rows and two ghosts) and a live board; specs override per case. */
export const replayRoutes = (): Record<string, Handler> => ({
  'GET /contests/r41': ok(endedContest()),
  'GET /contests/r41/replay': ok(replayChunk()),
  'GET /contests/r41/ranking': ok(r41Ranking()),
});
