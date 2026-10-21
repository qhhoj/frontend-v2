import { describe, expect, it } from 'vitest';
import type { PolygonImportBody } from '@/api/types/polygon';
import { polygonProblem } from '@/test/admin-fixtures/polygon';
import { emptyImportForm } from '../import/import-form';
import { initialWizardState, stepStatusOf, wizardReducer } from './polygon-wizard';
import type { ConfigureDraft, WizardState } from './polygon-wizard';

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/qhh-evolution-ioi';
const problem = polygonProblem();
const body = { code: 'xau_doi_xung', link: LINK } as PolygonImportBody;
const empty: WizardState = { step: 'link', link: '' };
const draft: ConfigureDraft = {
  form: { ...emptyImportForm(), code: 'xau_doi_xung', points: '1200', mode: 'update' },
  languages: { main: 'vietnamese', others: { english: 'en', russian: 'skip' }, tutorial: '' },
  autoSync: true,
};
const configuring: WizardState = { step: 'configure', link: LINK, problem, draft: null };
const started = (state: WizardState = configuring) =>
  wizardReducer(state, { type: 'started', jobId: 'job-1', body, draft });

describe('wizardReducer', () => {
  it('goes from a checked link to its options, and back with the link kept', () => {
    const next = wizardReducer(empty, { type: 'resolved', link: LINK, problem });
    expect(next).toEqual(configuring);
    expect(wizardReducer(next, { type: 'back' })).toEqual({ step: 'link', link: LINK });
  });

  it('follows the started job with the setup it came from', () => {
    expect(started()).toEqual({
      step: 'progress',
      jobId: 'job-1',
      body,
      setup: { link: LINK, problem, draft },
    });
  });

  it('edits: back to the options with the form, languages and auto-sync as they were sent', () => {
    expect(wizardReducer(started(), { type: 'edit' })).toEqual({
      step: 'configure',
      link: LINK,
      problem,
      draft,
    });
  });

  it('replaces the job on a retry or a repairing sync, keeping the body and the form', () => {
    const progress = started();
    const sync = wizardReducer(progress, { type: 'started', jobId: 'job-2', body: null });
    expect(sync).toEqual({ ...progress, jobId: 'job-2' });
    expect(wizardReducer(sync, { type: 'edit' })).toMatchObject({ step: 'configure', draft });
  });

  it('after a reload: nothing to edit or retry, but a repairing sync is followed', () => {
    const reloaded = initialWizardState('job-1');
    expect(reloaded).toEqual({ step: 'progress', jobId: 'job-1', body: null, setup: null });
    expect(wizardReducer(reloaded, { type: 'edit' })).toBe(reloaded);
    expect(wizardReducer(reloaded, { type: 'started', jobId: 'job-2', body: null })).toEqual({
      ...reloaded,
      jobId: 'job-2',
    });
  });

  it('ignores an edit outside the progress step', () => {
    expect(wizardReducer(configuring, { type: 'edit' })).toBe(configuring);
    expect(wizardReducer(empty, { type: 'edit' })).toBe(empty);
  });

  it('starts over from an empty link', () => {
    expect(wizardReducer(started(), { type: 'restart' })).toEqual(empty);
    expect(initialWizardState(null)).toEqual(empty);
  });
});

describe('stepStatusOf', () => {
  it('marks the steps before the current one done and the later ones upcoming', () => {
    expect(
      ['link', 'configure', 'progress'].map((step) => stepStatusOf(step as never, 'configure')),
    ).toEqual(['done', 'current', 'upcoming']);
  });
});
