import { apiGetPage, apiSend } from './typed';
import type { BalloonPage, BalloonQuery, BalloonRef } from './types/contest-ops';

export const BALLOON_PAGE_SIZE = 50;
/** The runners' sheet: the next ten pending balloons. */
export const PRINT_BATCH_SIZE = 10;

/** A count the page meta may carry; anything that is not a number (absent, or hidden during a freeze) reads as null. */
const countIn = (meta: object, name: string): number | null => {
  const value: unknown = Reflect.get(meta, name);
  return typeof value === 'number' ? value : null;
};

export async function fetchBalloons(key: string, query: BalloonQuery): Promise<BalloonPage> {
  const result = await apiGetPage('/contests/{key}/balloons', { path: { key }, query });
  return {
    items: result.items,
    total: result.meta.total ?? result.items.length,
    counts: {
      pendingTotal: countIn(result.meta, 'pendingTotal'),
      deliveredTotal: countIn(result.meta, 'deliveredTotal'),
    },
  };
}

const balloonPath = (key: string, balloon: BalloonRef) => ({
  key,
  participation: balloon.participationId,
  problem: balloon.problemId,
});
export const deliverBalloon = (key: string, balloon: BalloonRef) =>
  apiSend('post', '/contests/{key}/balloons/{participation}/{problem}/deliver', {
    path: balloonPath(key, balloon),
  });
export const undeliverBalloon = (key: string, balloon: BalloonRef) =>
  apiSend('post', '/contests/{key}/balloons/{participation}/{problem}/undeliver', {
    path: balloonPath(key, balloon),
  });
