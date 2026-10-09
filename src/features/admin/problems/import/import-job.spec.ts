import { describe, expect, it } from 'vitest';
import { isFinal, parseLanguageMap, phaseOf } from './import-job';

describe('import job', () => {
  it.each([
    ['waiting', 'queued'],
    ['delayed', 'queued'],
    ['prioritized', 'queued'],
    ['waiting-children', 'queued'],
    ['something-new', 'queued'],
    ['active', 'running'],
    ['completed', 'done'],
    ['failed', 'failed'],
  ])('reads BullMQ state %s as %s', (state, phase) => {
    expect(phaseOf(state)).toBe(phase);
  });

  it('stops only on done and failed', () => {
    expect(['queued', 'running', 'done', 'failed'].map((phase) => isFinal(phase as never))).toEqual(
      [false, false, true, true],
    );
  });

  it('reads polygon=site pairs and reports the ones that are not', () => {
    expect(parseLanguageMap('vietnamese=vi\nenglish=en, russian=ru,  ')).toEqual({
      pairs: ['vietnamese=vi', 'english=en'],
      invalid: ['russian=ru'],
    });
  });

  it('refuses a name the backend would answer 400 for: digits, underscores, hyphens, capitals', () => {
    expect(parseLanguageMap('viet_nam=vi, x1=en, a-b=vi, English=en')).toEqual({
      pairs: [],
      invalid: ['viet_nam=vi', 'x1=en', 'a-b=vi', 'English=en'],
    });
  });
});
