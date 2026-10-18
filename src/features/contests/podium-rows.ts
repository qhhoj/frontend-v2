import type { RankingRow } from '@/api/types/contests';

const PODIUM_LAST_RANK = 3;

/**
 * The podium's rows: live participants only, ranked among themselves. A virtual run never takes a podium place, so on a
 * board with virtual rows each live tie group is re-ranked as 1 + the live rows before it (ties stay ties). Every tied
 * row is kept: the podium shows the first names of a mass tie and counts the rest.
 */
export const podiumRows = (rows: readonly RankingRow[]): RankingRow[] => {
  const live = rows.filter((row) => row.virtual === 0 && row.rank !== null && !row.isDisqualified);
  let boardRank: number | null = null;
  let liveRank = 0;
  return live
    .map((row, index) => {
      if (row.rank !== boardRank) {
        boardRank = row.rank;
        liveRank = index + 1;
      }
      return { ...row, rank: liveRank };
    })
    .filter((row) => row.rank <= PODIUM_LAST_RANK);
};
