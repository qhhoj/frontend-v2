import type { ProblemListItem } from '@/api/types/problems';
import { isTrialDone } from '../problems/setup-steps';

export type SetupGap = 'statement' | 'tests' | 'points';

/** The editor tab that fixes each gap: the statement lives in "Đề bài", tests and points in "Dữ liệu chấm". */
export const GAP_ROUTE: Record<SetupGap, string> = {
  statement: 'admin-problemStatements',
  tests: 'admin-problemData',
  points: 'admin-problemData',
};

/**
 * What a problem still lacks, in setup order. `null` when the row has no readiness (the viewer may not edit it, or the
 * backfill has not reached it): the list then shows no mark at all, never a guess.
 */
export function setupGapsOf(setup: ProblemListItem['setup']): SetupGap[] | null {
  if (!setup) return null;
  const gaps: SetupGap[] = [];
  if (!setup.hasStatement) gaps.push('statement');
  if (!setup.hasTests) gaps.push('tests');
  if (!setup.hasPoints) gaps.push('points');
  return gaps;
}

/** The four segments of a row's setup mark, in order: information, statement, tests and judging, trial run. */
export const LIST_STEPS = ['info', 'statement', 'judging', 'trial'] as const;
export type ListStepId = (typeof LIST_STEPS)[number];

export interface ListStep {
  id: ListStepId;
  isDone: boolean;
  /** What doing the step means here (the words of the next-step link): the judging step asks for tests first, then points. */
  action: 'info' | SetupGap | 'trial';
  /** Where the step is done: an editor tab, or the problem page for the trial run. */
  routeName: string;
}

type SetupRow = Pick<ProblemListItem, 'setup' | 'viewerStatus'>;

/**
 * A row's four setup steps, from the server's readiness (`setupGapsOf`) and the checklist's trial rule. A created
 * problem always has its information. `null` when the row has no readiness: no mark and no next step.
 */
export function listStepsOf(problem: SetupRow): ListStep[] | null {
  const gaps = setupGapsOf(problem.setup);
  if (!gaps) return null;
  const judgingGap = gaps.find((gap) => gap !== 'statement');
  return [
    { id: 'info', isDone: true, action: 'info', routeName: 'admin-problemGeneral' },
    {
      id: 'statement',
      isDone: !gaps.includes('statement'),
      action: 'statement',
      routeName: GAP_ROUTE.statement,
    },
    {
      id: 'judging',
      isDone: judgingGap === undefined,
      action: judgingGap ?? 'tests',
      routeName: GAP_ROUTE[judgingGap ?? 'tests'],
    },
    {
      id: 'trial',
      isDone: isTrialDone(problem.viewerStatus),
      action: 'trial',
      routeName: 'problem',
    },
  ];
}

/** The step to do next: the first one not done; null when every step is done. */
export const nextListStep = (steps: readonly ListStep[]): ListStep | null =>
  steps.find((step) => !step.isDone) ?? null;
