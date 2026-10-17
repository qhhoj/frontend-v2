import { describe, expect, it } from 'vitest';
import { editableProblem, problemEditor, testCase } from '@/test/admin-fixtures/problems';
import { isSetupOpen, nextStep, setupSteps } from './setup-steps';

const fresh = editableProblem({
  editor: { ...problemEditor(), description: '', translations: [] },
});
const doneIds = (steps: ReturnType<typeof setupSteps>) =>
  steps.filter((step) => step.isDone).map((step) => step.id);

describe('setupSteps', () => {
  it('leads a new problem with no statement and no data to the statement first', () => {
    const steps = setupSteps(fresh, []);
    expect(doneIds(steps)).toEqual(['info']);
    expect(nextStep(steps)?.id).toBe('statement');
  });

  it('counts a statement written only as a translation', () => {
    const vietnameseOnly = editableProblem({
      editor: {
        ...problemEditor(),
        description: '',
        translations: [{ language: 'vi', name: 'Tổng', description: 'Cho $a$, $b$.' }],
      },
    });
    expect(nextStep(setupSteps(vietnameseOnly, []))?.id).toBe('tests');
    const blankTranslation = editableProblem({
      editor: {
        ...problemEditor(),
        description: ' ',
        translations: [{ language: 'en', name: 'Sum', description: '  ' }],
      },
    });
    expect(nextStep(setupSteps(blankTranslation, []))?.id).toBe('statement');
  });

  it('leads to the tests once the statement is written', () => {
    const written = editableProblem();
    expect(nextStep(setupSteps(written, null))).toMatchObject({
      id: 'tests',
      routeName: 'admin-problemData',
    });
  });

  it('asks for points when the cases score nothing', () => {
    const unscored = [testCase({ type: 'C', points: 0 })];
    expect(nextStep(setupSteps(editableProblem(), unscored))?.id).toBe('scoring');
  });

  it('then a trial submission on the problem page, then publishing', () => {
    const scored = [testCase({ type: 'C', points: 100 })];
    expect(nextStep(setupSteps(editableProblem(), scored))).toMatchObject({
      id: 'trial',
      routeName: 'problem',
    });
    const tried = editableProblem({ viewerStatus: 'attempted' });
    expect(nextStep(setupSteps(tried, scored))?.id).toBe('publish');
    const published = editableProblem({ viewerStatus: 'solved', isPublic: true });
    expect(nextStep(setupSteps(published, scored))).toBeNull();
  });
});

describe('isSetupOpen', () => {
  const scored = [testCase({ type: 'C', points: 100 })];

  it('stays open on a private problem while a step before publishing is open', () =>
    expect(isSetupOpen(fresh, setupSteps(fresh, []))).toBe(true));

  it('closes on a finished, tried site problem kept private, but not on an organization one', () => {
    const tried = editableProblem({ viewerStatus: 'solved' });
    expect(isSetupOpen(tried, setupSteps(tried, scored))).toBe(false);
    const orgProblem = editableProblem({ viewerStatus: 'solved', isOrganizationPrivate: true });
    expect(isSetupOpen(orgProblem, setupSteps(orgProblem, scored))).toBe(true);
  });

  it('never shows on a public problem', () => {
    const published = editableProblem({ isPublic: true });
    expect(isSetupOpen(published, setupSteps(published, []))).toBe(false);
  });
});
