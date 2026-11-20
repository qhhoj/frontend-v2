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

/** The trial step: the viewer has submitted to the problem. The one rule for the checklist and the problem list's mark. */
export const isTrialDone = (viewerStatus: EditableProblem['viewerStatus']) => viewerStatus !== null;

const isWritten = (text: string | undefined) => (text ?? '').trim() !== '';

/**
 * A statement in any slot counts: the base description, a translation's (a new problem is often written in Vietnamese
 * only) or a PDF statement.
 */
const hasStatement = (problem: EditableProblem) =>
  problem.pdfStatementUrl !== null ||
  isWritten(problem.editor?.description) ||
  (problem.editor?.translations ?? []).some((translation) => isWritten(translation.description));

/**
 * Mock-up 3C: the manual setup of a new problem, in order — information, statement, tests, checker and points, a trial
 * submission, publishing. `cases` is null while the test data is unknown (counted as not done).
 */
export function setupSteps(
  problem: EditableProblem,
  cases: readonly TestCase[] | null,
): SetupStep[] {
  // An external-judge problem keeps its tests and points on the remote judge.
  const isExternal = problem.externalJudge !== null;
  const hasCases = (cases ?? []).some((testCase) => testCase.type === 'C');
  return [
    { id: 'info', isDone: true, routeName: 'admin-problemGeneral' },
    { id: 'statement', isDone: hasStatement(problem), routeName: 'admin-problemStatements' },
    { id: 'tests', isDone: isExternal || hasCases, routeName: 'admin-problemData' },
    {
      id: 'scoring',
      isDone: isExternal || (hasCases && scoredCasePoints(cases ?? []) > 0),
      routeName: 'admin-problemData',
    },
    { id: 'trial', isDone: isTrialDone(problem.viewerStatus), routeName: 'problem' },
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

/** The setup steps each editor tab finishes; a tab not listed here has no setup state. */
const TAB_STEPS: Readonly<Record<string, readonly SetupStepId[]>> = {
  statements: ['statement'],
  data: ['tests', 'scoring'],
};

/** Whether a tab's setup steps are all done: true or false, or null for a tab with no steps. */
export function tabSetupDone(tabId: string, steps: readonly SetupStep[]): boolean | null {
  const ids = TAB_STEPS[tabId];
  if (!ids) return null;
  return steps.filter((step) => ids.includes(step.id)).every((step) => step.isDone);
}
