import type { ContestDetail } from '@/api/types/contests';
import type { ReplayChunk } from '@/api/types/replay';
import { contestPageRoutes } from './contest-routes';
import { fail } from './mock-api';
import type { MockHandler } from './mock-api';
import { endedContest, replayChunk } from './replay-fixtures';

/** `GET /contests/<key>/replay` answering chunk n with `chunks[n]` (202 while building), 404 beyond. */
export const replayRoute = (
  key: string,
  chunks: ReplayChunk[] = [replayChunk()],
): Record<string, MockHandler> => ({
  [`GET /contests/${encodeURIComponent(key)}/replay`]: (call) => {
    const chunk = chunks[Number(call.query.get('chunk') ?? 0)];
    if (!chunk) return fail(404, 'replay_chunk_not_found');
    return { status: chunk.state === 'building' ? 202 : 200, body: { data: chunk } };
  },
});

/** The replay page of an ended contest: detail, announcements (ContestTabs) and the replay. */
export const replayPageRoutes = (
  detail: ContestDetail = endedContest(),
  chunks?: ReplayChunk[],
): Record<string, MockHandler> => ({
  ...contestPageRoutes(detail),
  ...replayRoute(detail.key, chunks),
});
