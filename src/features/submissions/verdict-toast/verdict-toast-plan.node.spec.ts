import { describe, expect, it } from 'vitest';
import { verdictOfCode } from '@/lib/verdicts';
import { planVerdictToast, toastScore, trackingStep } from './verdict-toast-plan';

const base = {
  verdict: verdictOfCode('AC'),
  isResultOnScreen: false,
  wasSolvedBefore: false,
  hasCelebratedProblem: false,
};

describe('planVerdictToast', () => {
  it('shows nothing when the result is already on screen', () => {
    expect(planVerdictToast({ ...base, isResultOnScreen: true })).toBeNull();
  });

  it('celebrates the first accepted verdict of a problem', () => {
    expect(planVerdictToast(base)).toEqual({ celebrate: true });
  });

  it('does not celebrate a problem solved before or already celebrated', () => {
    expect(planVerdictToast({ ...base, wasSolvedBefore: true })).toEqual({ celebrate: false });
    expect(planVerdictToast({ ...base, hasCelebratedProblem: true })).toEqual({ celebrate: false });
  });

  it.each(['PC', 'WA', 'TLE', 'CE', 'IE'] as const)('never celebrates %s', (code) => {
    expect(planVerdictToast({ ...base, verdict: verdictOfCode(code) })).toEqual({
      celebrate: false,
    });
  });
});

describe('trackingStep', () => {
  it.each([
    ['QU', 'wait'],
    ['P', 'wait'],
    ['G', 'wait'],
    ['D', 'announce'],
    ['CE', 'announce'],
    ['PD', 'drop'],
  ] as const)('%s -> %s', (status, step) => {
    expect(trackingStep(status)).toBe(step);
  });
});

describe('toastScore', () => {
  const site = { problemPoints: 100, contest: null };
  const inContest = {
    problemPoints: 100,
    contest: { key: 'c1', points: 500, partial: true, precision: 1 },
  };

  it('scores a site submission on the problem points', () => {
    expect(toastScore({ points: 40, problemPoints: 100, contest: null, scale: site })).toEqual({
      score: 40,
      max: 100,
      contestPrecision: null,
    });
  });

  it('scores a contest submission on the contest scale', () => {
    const contest = { key: 'c1', points: 250 };
    expect(toastScore({ points: 50, problemPoints: 100, contest, scale: inContest })).toEqual({
      score: 250,
      max: 500,
      contestPrecision: 1,
    });
  });

  it('shows no score for a contest submission whose contest scale is unknown', () => {
    const contest = { key: 'c1', points: 250 };
    expect(toastScore({ points: 50, problemPoints: 100, contest, scale: site })).toBeNull();
    const other = { ...inContest, contest: { ...inContest.contest, key: 'c2' } };
    expect(toastScore({ points: 50, problemPoints: 100, contest, scale: other })).toBeNull();
    expect(
      toastScore({ points: 50, problemPoints: 100, contest: null, scale: inContest }),
    ).toBeNull();
  });
});
