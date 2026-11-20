import type { EditableProblem } from '@/api/types/problem-editing';
import type { TestCase } from '@/api/types/problem-data';
import { scoredCasePoints } from './general/publish-readiness';

export type SetupStepId = 'info' | 'statement' | 'tests' | 'scoring' | 'trial' | 'publish';

export interface SetupStep {
  id: SetupStepId;
  isDone: boolean;
  /** Where the step is done: the workbench (an old tab address opens its section; the general one opens the next step). */
  routeName: string;
}

/**
 * The trial step: the viewer has an accepted submission to the problem (`solved`: an AC that earned every test's points).
 * The one rule for the plate's step, the trial section's summary, the publish warning and the lists' setup mark. The API
 * cannot say whether that submission was judged on the tests as they are now, nor whether another editor has one.
 */
export const isTrialDone = (viewerStatus: EditableProblem['viewerStatus']) =>
  viewerStatus === 'solved';

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
 * Mock-up 3C: the manual setup of a new problem, in order — information, statement, tests, checker and points, an
 * accepted trial run, publishing. `cases` is null while the test data is unknown (counted as not done).
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
    { id: 'trial', isDone: isTrialDone(problem.viewerStatus), routeName: 'admin-problemGeneral' },
    { id: 'publish', isDone: problem.isPublic, routeName: 'admin-problemGeneral' },
  ];
}

/** The step to do next: the first one not done; null when every step is done. */
export const nextStep = (steps: readonly SetupStep[]): SetupStep | null =>
  steps.find((step) => !step.isDone) ?? null;

/** The workbench shows four steps: tests and their points are one step there ("Test và cách chấm"). */
export const WORKBENCH_STEPS = {
  info: ['info'],
  statement: ['statement'],
  tests: ['tests', 'scoring'],
  trial: ['trial'],
} as const satisfies Record<string, readonly SetupStepId[]>;
export type WorkbenchStepId = keyof typeof WORKBENCH_STEPS;

export interface WorkbenchStep {
  id: WorkbenchStepId;
  isDone: boolean;
  /** The setup steps of this one still open, in order: what the plate names as the reason. */
  missing: SetupStepId[];
}

/** The four workbench steps, from the same rule as every other readiness mark (`setupSteps`). */
export function workbenchSteps(steps: readonly SetupStep[]): WorkbenchStep[] {
  return (Object.keys(WORKBENCH_STEPS) as WorkbenchStepId[]).map((id) => {
    const parts: readonly SetupStepId[] = WORKBENCH_STEPS[id];
    const missing = steps
      .filter((step) => parts.includes(step.id) && !step.isDone)
      .map((step) => step.id);
    return { id, isDone: missing.length === 0, missing };
  });
}

/**
 * What publishing waits for: a statement, tests and their points (a contestant can do nothing without them). The trial
 * submission is not here: publishing without it is allowed and the confirm dialog warns.
 */
const PUBLISH_BLOCKERS: readonly SetupStepId[] = ['statement', 'tests', 'scoring'];
export const publishBlockers = (steps: readonly SetupStep[]): SetupStep[] =>
  steps.filter((step) => PUBLISH_BLOCKERS.includes(step.id) && !step.isDone);

/** What the publish dialog warns about: every step before publishing that is still open. */
export const publishWarnings = (steps: readonly SetupStep[]): SetupStep[] =>
  steps.filter((step) => step.id !== 'info' && step.id !== 'publish' && !step.isDone);
