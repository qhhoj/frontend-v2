import type { EditableProblem } from '@/api/types/problem-editing';
import type { TestCase } from '@/api/types/problem-data';
import { scoredCasePoints } from './general/publish-readiness';

export type SetupStepId = 'info' | 'statement' | 'tests' | 'scoring' | 'trial' | 'publish';

export interface SetupStep {
  id: SetupStepId;
  isDone: boolean;
  /** Where the step is done: an editor tab or the problem page. */
  routeName: string;
}

/**
 * Mock-up 3C: the manual setup of a new problem, in order — information, statement, tests, checker and points, a trial
 * submission, publishing. `cases` is null while the test data is unknown (counted as not done).
 */
export function setupSteps(
  problem: EditableProblem,
  cases: readonly TestCase[] | null,
): SetupStep[] {
  const hasCases = (cases ?? []).some((testCase) => testCase.type === 'C');
  return [
    { id: 'info', isDone: true, routeName: 'admin-problemGeneral' },
    {
      id: 'statement',
      isDone: (problem.editor?.description ?? '').trim() !== '',
      routeName: 'admin-problemStatements',
    },
    { id: 'tests', isDone: hasCases, routeName: 'admin-problemData' },
    {
      id: 'scoring',
      isDone: hasCases && scoredCasePoints(cases ?? []) > 0,
      routeName: 'admin-problemData',
    },
    { id: 'trial', isDone: problem.viewerStatus !== null, routeName: 'problem' },
    { id: 'publish', isDone: problem.isPublic, routeName: 'admin-problemGeneral' },
  ];
}

/** The step to do next: the first one not done; null when every step is done. */
export const nextStep = (steps: readonly SetupStep[]): SetupStep | null =>
  steps.find((step) => !step.isDone) ?? null;

/**
 * Whether the checklist is shown: never on a public problem; on a private one while a setup step before publishing is
 * open, or until an organization problem is shown to its members. A finished, tried site problem kept private (a contest
 * problem) shows nothing.
 */
export function isSetupOpen(problem: EditableProblem, steps: readonly SetupStep[]): boolean {
  if (problem.isPublic) return false;
  const beforePublishing = steps.filter((step) => step.id !== 'publish');
  return problem.isOrganizationPrivate || beforePublishing.some((step) => !step.isDone);
}
