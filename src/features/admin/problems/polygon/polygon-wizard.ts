import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import { cardBlockOf } from './pick-filter';

export const WIZARD_STEPS = ['pick', 'configure', 'progress'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export type WizardState =
  | { step: 'pick'; selected: PolygonProblem | null }
  | { step: 'configure'; problem: PolygonProblem }
  /** After a reload only the job id (from the URL) is known: no problem, no body to retry with. */
  | {
      step: 'progress';
      jobId: string;
      problem: PolygonProblem | null;
      body: PolygonImportBody | null;
    };

export type WizardEvent =
  | { type: 'select'; problem: PolygonProblem }
  | { type: 'next' }
  | { type: 'back' }
  | { type: 'started'; jobId: string; body: PolygonImportBody }
  | { type: 'restart' };

/** A job id in the URL opens the progress step, so a reload keeps following the import. */
export const initialWizardState = (jobId: string | null): WizardState =>
  jobId ? { step: 'progress', jobId, problem: null, body: null } : { step: 'pick', selected: null };

function onStarted(state: WizardState, jobId: string, body: PolygonImportBody): WizardState {
  if (state.step === 'configure') return { step: 'progress', jobId, problem: state.problem, body };
  // A retry starts a new job for the same problem and options.
  if (state.step === 'progress' && state.problem)
    return { step: 'progress', jobId, problem: state.problem, body };
  return state;
}

/** The wizard's moves; an event that does not fit the current step leaves the state as it is. */
export function wizardReducer(state: WizardState, event: WizardEvent): WizardState {
  switch (event.type) {
    case 'select':
      return state.step === 'pick' && cardBlockOf(event.problem) === null
        ? { step: 'pick', selected: event.problem }
        : state;
    case 'next':
      return state.step === 'pick' && state.selected
        ? { step: 'configure', problem: state.selected }
        : state;
    case 'back':
      return state.step === 'configure' ? { step: 'pick', selected: state.problem } : state;
    case 'started':
      return onStarted(state, event.jobId, event.body);
    case 'restart':
      return { step: 'pick', selected: null };
  }
}

/** Each step's place in the strip: the ones before the current step are done. */
export const stepStatusOf = (step: WizardStep, current: WizardStep) => {
  const offset = WIZARD_STEPS.indexOf(step) - WIZARD_STEPS.indexOf(current);
  return offset < 0 ? 'done' : offset === 0 ? 'current' : 'upcoming';
};
