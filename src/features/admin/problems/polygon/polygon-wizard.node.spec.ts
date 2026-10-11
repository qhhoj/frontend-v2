import { describe, expect, it } from 'vitest';
import type { PolygonImportBody } from '@/api/types/polygon';
import { polygonPackage, polygonProblem } from '@/test/admin-fixtures/polygon';
import { initialWizardState, stepStatusOf, wizardReducer } from './polygon-wizard';
import type { WizardState } from './polygon-wizard';

const ready = polygonProblem();
const running = polygonProblem({
  id: 2,
  latestPackage: polygonPackage({ id: 3, revision: 4, state: 'RUNNING' }),
});
const body = { code: 'xau_doi_xung' } as PolygonImportBody;
const pick: WizardState = { step: 'pick', selected: null };

describe('wizardReducer', () => {
  it('picks a READY problem, goes on to configure it and back with the choice kept', () => {
    const picked = wizardReducer(pick, { type: 'select', problem: ready });
    const configuring = wizardReducer(picked, { type: 'next' });
    expect(configuring).toEqual({ step: 'configure', problem: ready });
    expect(wizardReducer(configuring, { type: 'back' })).toEqual({ step: 'pick', selected: ready });
  });

  it('ignores a blocked card and does not go on without a choice', () => {
    expect(wizardReducer(pick, { type: 'select', problem: running })).toBe(pick);
    expect(wizardReducer(pick, { type: 'next' })).toBe(pick);
  });

  it('follows the started job, and a retry replaces it with the same problem and options', () => {
    const progress = wizardReducer(
      { step: 'configure', problem: ready },
      { type: 'started', jobId: 'job-1', body },
    );
    expect(progress).toEqual({ step: 'progress', jobId: 'job-1', problem: ready, body });
    expect(wizardReducer(progress, { type: 'started', jobId: 'job-2', body })).toEqual({
      step: 'progress',
      jobId: 'job-2',
      problem: ready,
      body,
    });
  });

  it('cannot retry a job opened from the URL: the problem and options are unknown', () => {
    const reloaded = initialWizardState('job-1');
    expect(reloaded).toEqual({ step: 'progress', jobId: 'job-1', problem: null, body: null });
    expect(wizardReducer(reloaded, { type: 'started', jobId: 'job-2', body })).toBe(reloaded);
  });

  it('starts over from an empty pick', () => {
    const progress: WizardState = { step: 'progress', jobId: 'j', problem: ready, body };
    expect(wizardReducer(progress, { type: 'restart' })).toEqual(pick);
    expect(initialWizardState(null)).toEqual(pick);
  });
});

describe('stepStatusOf', () => {
  it('marks the steps before the current one done and the later ones upcoming', () => {
    expect(
      ['pick', 'configure', 'progress'].map((step) => stepStatusOf(step as never, 'configure')),
    ).toEqual(['done', 'current', 'upcoming']);
  });
});
