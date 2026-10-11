import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';

export const WIZARD_STEPS = ['link', 'configure', 'progress'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

export type WizardState =
  /** `link` is what the field shows: kept when coming back from the options. */
  | { step: 'link'; link: string }
  | { step: 'configure'; link: string; problem: PolygonProblem }
  /** After a reload only the job id (from the URL) is known: no body (and so no link) to retry with. */
  | { step: 'progress'; jobId: string; body: PolygonImportBody | null };

export type WizardEvent =
  | { type: 'resolved'; link: string; problem: PolygonProblem }
  | { type: 'back' }
  | { type: 'started'; jobId: string; body: PolygonImportBody }
  | { type: 'restart' };

const EMPTY: WizardState = { step: 'link', link: '' };

/** A job id in the URL opens the progress step, so a reload keeps following the import. */
export const initialWizardState = (jobId: string | null): WizardState =>
  jobId ? { step: 'progress', jobId, body: null } : EMPTY;

function onStarted(state: WizardState, jobId: string, body: PolygonImportBody): WizardState {
  if (state.step === 'configure') return { step: 'progress', jobId, body };
  // A retry starts a new job with the same link and options.
  if (state.step === 'progress' && state.body) return { step: 'progress', jobId, body };
  return state;
}

/** The wizard's moves; an event that does not fit the current step leaves the state as it is. */
export function wizardReducer(state: WizardState, event: WizardEvent): WizardState {
  switch (event.type) {
    case 'resolved':
      return state.step === 'link'
        ? { step: 'configure', link: event.link, problem: event.problem }
        : state;
    case 'back':
      return state.step === 'configure' ? { step: 'link', link: state.link } : state;
    case 'started':
      return onStarted(state, event.jobId, event.body);
    case 'restart':
      return EMPTY;
  }
}

/** Each step's place in the strip: the ones before the current step are done. */
export const stepStatusOf = (step: WizardStep, current: WizardStep) => {
  const offset = WIZARD_STEPS.indexOf(step) - WIZARD_STEPS.indexOf(current);
  return offset < 0 ? 'done' : offset === 0 ? 'current' : 'upcoming';
};
