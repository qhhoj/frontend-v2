import { ref, watch } from 'vue';
import type { Ref } from 'vue';
import type { Ranking, RankingRow } from '@/api/types/contests';
import type { RankingContext } from '@/lib/ranking-cells';

/**
 * True while the board on screen has just been replaced by a newer read of the same board (the running contest's
 * poll). Only then do numbers tick and rows move. It is false after anything else that changes what is drawn: the first
 * load (no change is watched yet), a search (the rows change, the board does not), a switch to another board (the
 * old one is on screen as stale data while the new one loads) and a change of the print context.
 * Each change recomputes the flag, so a search right after a poll turns it off again.
 */
export function useLiveBoard(
  ranking: () => Ranking,
  rows: () => RankingRow[],
  context: () => RankingContext,
  isStale: () => boolean,
): Ref<boolean> {
  const isLive = ref(false);
  watch(
    [ranking, rows, context, isStale],
    ([nextRanking, , nextContext, nextStale], [prevRanking, , prevContext, prevStale]) => {
      isLive.value =
        nextRanking !== prevRanking &&
        nextContext === prevContext &&
        !nextStale &&
        !prevStale &&
        prevRanking.rows.length > 0;
    },
  );
  return isLive;
}
