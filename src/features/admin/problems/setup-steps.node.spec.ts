import { describe, expect, it } from 'vitest';
import { editableProblem, problemEditor, testCase } from '@/test/admin-fixtures/problems';
import {
  nextStep,
  publishBlockers,
  publishWarnings,
  setupSteps,
  workbenchSteps,
} from './setup-steps';

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
        translations: [
          { language: 'vi', name: 'Tổng', description: 'Cho $a$, $b$.', isMarkupTrusted: false },
        ],
      },
    });
    expect(nextStep(setupSteps(vietnameseOnly, []))?.id).toBe('tests');
    const blankTranslation = editableProblem({
      editor: {
        ...problemEditor(),
        description: ' ',
        translations: [{ language: 'en', name: 'Sum', description: '  ', isMarkupTrusted: false }],
      },
    });
    expect(nextStep(setupSteps(blankTranslation, []))?.id).toBe('statement');
  });

  it('counts a PDF statement as a written statement', () => {
    const pdfOnly = editableProblem({
      editor: { ...problemEditor(), description: '', translations: [] },
      pdfStatementUrl: '/files/statement.pdf',
    });
    expect(doneIds(setupSteps(pdfOnly, []))).toContain('statement');
  });

  it('counts tests and points done for an external-judge problem', () => {
    const external = editableProblem({
      externalJudge: { oj: 'CodeForces' },
    });
    expect(doneIds(setupSteps(external, null))).toEqual(
      expect.arrayContaining(['tests', 'scoring']),
    );
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

describe('the workbench plate', () => {
  const scored = [testCase({ type: 'C', points: 10 })];
  const unscored = [testCase({ type: 'C', points: 0 })];

  it('shows tests and their points as one step and names what it still misses', () => {
    const steps = workbenchSteps(setupSteps(editableProblem(), unscored));
    expect(steps.map((step) => step.id)).toEqual(['info', 'statement', 'tests', 'trial']);
    expect(steps.find((step) => step.id === 'tests')).toMatchObject({
      isDone: false,
      missing: ['scoring'],
    });
  });

  it('holds publishing for a missing statement or tests, and only warns about a missing trial', () => {
    const untried = setupSteps(editableProblem(), scored);
    expect(publishBlockers(untried)).toEqual([]);
    expect(publishWarnings(untried).map((step) => step.id)).toEqual(['trial']);
    const noTests = setupSteps(editableProblem(), []);
    expect(publishBlockers(noTests).map((step) => step.id)).toEqual(['tests', 'scoring']);
  });
});
