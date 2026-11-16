import type { ContestListItem } from '@/api/types/contests';

/**
 * Which contest of a running or upcoming group is the large card. A running contest the viewer is in (their current one first,
 * then any joined) wins, then the one that started most recently; an upcoming contest the viewer registered for wins, then the
 * one that starts first. A signed-out visitor has no participation, so the start decides.
 */
const rank = (contest: ContestListItem): number => {
  if (contest.viewer?.isCurrent) return 2;
  return contest.viewer?.liveStatus ? 1 : 0;
};

export function featuredFirst(
  contests: readonly ContestListItem[],
  isRunning: boolean,
): ContestListItem[] {
  const startOf = (contest: ContestListItem) => Date.parse(contest.startTime);
  const startOrder = (a: ContestListItem, b: ContestListItem) =>
    isRunning ? startOf(b) - startOf(a) : startOf(a) - startOf(b);
  return [...contests].sort((a, b) => rank(b) - rank(a) || startOrder(a, b));
}
