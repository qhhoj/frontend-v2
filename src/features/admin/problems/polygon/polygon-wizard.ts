import type { PolygonImportBody, PolygonProblem } from '@/api/types/polygon';
import type { ImportForm } from '../import/import-form';
import type { LanguageChoice } from './polygon-languages';

export const WIZARD_STEPS = ['link', 'configure', 'progress'] as const;
export type WizardStep = (typeof WIZARD_STEPS)[number];

/** The configure step's form as the setter left it: "Sửa thiết lập" refills it from here. */
export interface ConfigureDraft {
  form: ImportForm;
  languages: LanguageChoice;
  autoSync: boolean;
}

/** What the configure step needs to show again: the checked link, its preview and (once started) the form. */
export interface ConfigureSetup {
  link: string;
  problem: PolygonProblem;
  draft: ConfigureDraft | null;
}

export type WizardState =
  /** `link` is what the field shows: kept when coming back from the options. */
  | { step: 'link'; link: string }
  | ({ step: 'configure' } & ConfigureSetup)
  /**
   * After a reload, or once a sync repairs the imported problem, only the job id is known: no body to retry with and
   * no setup to edit (a sync runs on the link's saved options); a new job can still be followed.
   */
  | {
      step: 'progress';
      jobId: string;
      body: PolygonImportBody | null;
      setup: ConfigureSetup | null;
    };

export type WizardEvent =
  | { type: 'resolved'; link: string; problem: PolygonProblem }
  | { type: 'back' }
  | { type: 'started'; jobId: string; body: PolygonImportBody | null; draft?: ConfigureDraft }
  | { type: 'edit' }
  | { type: 'restart' };

const EMPTY: WizardState = { step: 'link', link: '' };

/** A job id in the URL opens the progress step, so a reload keeps following the import. */
export const initialWizardState = (jobId: string | null): WizardState =>
  jobId ? { step: 'progress', jobId, body: null, setup: null } : EMPTY;

function onStarted(
  state: WizardState,
  event: Extract<WizardEvent, { type: 'started' }>,
): WizardState {
  const { jobId, body, draft = null } = event;
  if (state.step === 'configure') {
    const setup = { link: state.link, problem: state.problem, draft };
    return { step: 'progress', jobId, body, setup };
  }
  if (state.step !== 'progress') return state;
  // A retry: the same body and form. A repairing sync runs on the link's saved options: neither applies any more.
  return body ? { ...state, jobId, body } : { step: 'progress', jobId, body: null, setup: null };
}

/** Back to the options as they were sent; nothing to go back to after a reload. */
const onEdit = (state: WizardState): WizardState =>
  state.step === 'progress' && state.setup ? { step: 'configure', ...state.setup } : state;

/** The wizard's moves; an event that does not fit the current step leaves the state as it is. */
export function wizardReducer(state: WizardState, event: WizardEvent): WizardState {
  switch (event.type) {
    case 'resolved':
      return state.step === 'link'
        ? { step: 'configure', link: event.link, problem: event.problem, draft: null }
        : state;
    case 'back':
      return state.step === 'configure' ? { step: 'link', link: state.link } : state;
    case 'started':
      return onStarted(state, event);
    case 'edit':
      return onEdit(state);
    case 'restart':
      return EMPTY;
  }
}

/** Each step's place in the strip: the ones before the current step are done. */
export const stepStatusOf = (step: WizardStep, current: WizardStep) => {
  const offset = WIZARD_STEPS.indexOf(step) - WIZARD_STEPS.indexOf(current);
  return offset < 0 ? 'done' : offset === 0 ? 'current' : 'upcoming';
};
