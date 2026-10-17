import { describe, expect, it } from 'vitest';
import { submissionCase, submissionDetail } from '@/test/fixtures';
import { heroParts } from './hero-line';

const language = { id: 1, key: 'PY3', name: 'Python 3' };

describe('heroParts', () => {
  it('names the first failing test, counts the passed ones against the test count, then time, memory and language', () => {
    const row = submissionDetail({
      cases: [
        submissionCase({ position: 1 }),
        submissionCase({ position: 2, status: 'SC' }),
        submissionCase({ position: 3, status: 'TLE' }),
        submissionCase({ position: 4, status: 'WA' }),
      ],
      totalCases: 20,
      time: 0.5,
      memory: 2048,
      language: language as never,
    });
    expect(heroParts(row)).toEqual([
      { key: 'failed', values: { number: 3, status: 'TLE' } },
      { key: 'passed', values: { passed: 1, total: 20 } },
      { text: '0.50s' },
      { text: '2.0 MB' },
      { text: 'Python 3' },
    ]);
  });

  it('has no failing part when every test passed, and counts the shown tests when the total is unknown', () => {
    const row = submissionDetail({
      cases: [submissionCase({ position: 1 }), submissionCase({ position: 2 })],
      totalCases: null,
      time: null,
      memory: null,
      language: null,
    });
    expect(heroParts(row)).toEqual([{ key: 'passed', values: { passed: 2, total: 2 } }]);
  });

  it('counts a test with part of its points as not passed, like the overview', () => {
    const row = submissionDetail({
      cases: [
        submissionCase({ position: 1, points: 1, total: 1 }),
        submissionCase({ position: 2, points: 0.5, total: 1 }),
      ],
      totalCases: 2,
      time: null,
      memory: null,
      language: null,
    });
    expect(heroParts(row)).toEqual([{ key: 'passed', values: { passed: 1, total: 2 } }]);
  });

  it('leaves the test parts out when the case results are hidden', () => {
    const row = submissionDetail({ cases: null, time: 1, memory: 1024, language: null });
    expect(heroParts(row)).toEqual([{ text: '1.00s' }, { text: '1.0 MB' }]);
  });
});
