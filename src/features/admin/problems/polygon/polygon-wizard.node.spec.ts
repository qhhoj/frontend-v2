import { describe, expect, it } from 'vitest';
import type { PolygonImportBody } from '@/api/types/polygon';
import { polygonProblem } from '@/test/admin-fixtures/polygon';
import { initialWizardState, stepStatusOf, wizardReducer } from './polygon-wizard';
import type { WizardState } from './polygon-wizard';

const LINK = 'https://polygon.codeforces.com/p3n21nw/LamTerQH/qhh-evolution-ioi';
const problem = polygonProblem();
const body = { code: 'xau_doi_xung', link: LINK } as PolygonImportBody;
const empty: WizardState = { step: 'link', link: '' };

describe('wizardReducer', () => {
  it('goes from a checked link to its options, and back with the link kept', () => {
    const configuring = wizardReducer(empty, { type: 'resolved', link: LINK, problem });
    expect(configuring).toEqual({ step: 'configure', link: LINK, problem });
    expect(wizardReducer(configuring, { type: 'back' })).toEqual({ step: 'link', link: LINK });
  });

  it('follows the started job, and a retry replaces it with the same link and options', () => {
    const progress = wizardReducer(
      { step: 'configure', link: LINK, problem },
      { type: 'started', jobId: 'job-1', body },
    );
    expect(progress).toEqual({ step: 'progress', jobId: 'job-1', body });
    expect(wizardReducer(progress, { type: 'started', jobId: 'job-2', body })).toEqual({
      step: 'progress',
      jobId: 'job-2',
      body,
    });
  });

  it('cannot retry a job opened from the URL: the link and options are unknown', () => {
    const reloaded = initialWizardState('job-1');
    expect(reloaded).toEqual({ step: 'progress', jobId: 'job-1', body: null });
    expect(wizardReducer(reloaded, { type: 'started', jobId: 'job-2', body })).toBe(reloaded);
  });

  it('starts over from an empty link', () => {
    const progress: WizardState = { step: 'progress', jobId: 'j', body };
    expect(wizardReducer(progress, { type: 'restart' })).toEqual(empty);
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
