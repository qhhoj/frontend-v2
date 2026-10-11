import { describe, expect, it } from 'vitest';
import { parseLanguageMap, phaseOf } from './import-job';

describe('import job', () => {
  it('reads an unknown BullMQ state as queued, so a new state never ends the polling', () => {
    expect(phaseOf('something-new')).toBe('queued');
    expect(phaseOf('active')).toBe('running');
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
