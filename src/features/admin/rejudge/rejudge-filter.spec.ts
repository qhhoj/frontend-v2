import { describe, expect, it } from 'vitest';
import { checkRejudgeFilter, emptyRejudgeFilter, toRejudgeBody } from './rejudge-filter';

const ID = '0198c3a1-0000-7000-8000-000000000001';

describe('rejudge filter', () => {
  it('needs a problem code and refuses ids that are not submission ids', () => {
    expect(Object.keys(checkRejudgeFilter(emptyRejudgeFilter()))).toEqual(['problem']);
    expect(
      Object.keys(checkRejudgeFilter({ ...emptyRejudgeFilter(), problem: 'p', idFrom: '128' })),
    ).toEqual(['idFrom']);
  });

  it('sends only what was chosen', () => {
    expect(toRejudgeBody({ ...emptyRejudgeFilter(), problem: ' hcmus41c ' })).toEqual({
      problem: 'hcmus41c',
    });
    expect(
      toRejudgeBody({
        problem: 'p',
        idFrom: ID,
        idTo: '',
        languageIds: ['l1'],
        results: ['WA', 'TLE'],
        force: true,
      }),
    ).toEqual({
      problem: 'p',
      idFrom: ID,
      languages: ['l1'],
      results: ['WA', 'TLE'],
      force: true,
    });
  });
});
