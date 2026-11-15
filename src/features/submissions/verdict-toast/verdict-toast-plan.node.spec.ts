import { describe, expect, it } from 'vitest';
import { verdictOfCode } from '@/lib/verdicts';
import { planVerdictToast } from './verdict-toast-plan';

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
