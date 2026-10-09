import type { ContestProblem } from '@/api/types/contests';

export type SwitcherStatus = 'solved' | 'tried' | 'untried' | 'unknown';
export interface SwitcherEntry {
  code: string;
  label: string;
  name: string;
  status: SwitcherStatus;
  isCurrent: boolean;
}

function statusOf(problem: ContestProblem): SwitcherStatus {
  const result = problem.viewerResult;
  if (result === null) return 'unknown';
  if (result.isSolved) return 'solved';
  return result.attempts > 0 ? 'tried' : 'untried';
}

/** The rail's rows in contest order; null when the contest does not list the problem (the switcher is then not shown). */
export function switcherEntries(
  problems: ContestProblem[] | null,
  currentCode: string,
): SwitcherEntry[] | null {
  if (!problems?.some((problem) => problem.code === currentCode)) return null;
  return problems.map((problem) => ({
    code: problem.code,
    label: problem.label,
    name: problem.name,
    status: statusOf(problem),
    isCurrent: problem.code === currentCode,
  }));
}
