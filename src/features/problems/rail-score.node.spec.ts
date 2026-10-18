import { describe, expect, it } from 'vitest';
import { railScore } from './rail-score';
import type { ScoreScale } from './submit-result';

const inRound: ScoreScale = {
  problemPoints: 1600,
  contest: { key: 'r42', points: 250, partial: false, precision: 1 },
};
const practice: ScoreScale = { problemPoints: 1600, contest: null };
const made = (key: string, points: number | null) => ({ key, name: key, points, minute: null });

describe('railScore', () => {
  it("counts a contest submission on the contest's points and is out of the viewer's own contest", () => {
    const row = { points: 800, contest: made('r42', 125) };
    expect(railScore(row, inRound)).toEqual({ scale: 'contest', points: 125, max: 250, digits: 1 });
  });

  it("does not borrow the viewer's contest maximum for another contest's submission", () => {
    const row = { points: 1600, contest: made('r41', 120.5) };
    expect(railScore(row, inRound)).toMatchObject({ scale: 'contest', points: 120.5, max: null });
    expect(railScore(row, practice)).toMatchObject({ scale: 'contest', points: 120.5, max: null });
  });

  it("counts a submission outside any contest on the problem's points, in a contest page too", () => {
    const row = { points: 800, contest: null };
    expect(railScore(row, inRound)).toEqual({ scale: 'site', points: 800, max: 1600, digits: 2 });
    expect(railScore(row, practice)).toEqual({ scale: 'site', points: 800, max: 1600, digits: 2 });
  });

  it("leaves the problem's score when the contest holds no points for a judged submission", () => {
    const row = { points: 1600, contest: made('r42', null) };
    expect(railScore(row, inRound)).toMatchObject({ scale: 'site', points: 1600, max: 1600 });
  });

  it('shows no score, on the contest scale, while a contest submission is unjudged', () => {
    for (const held of [null, 0]) {
      const row = { points: null, contest: made('r42', held) };
      expect(railScore(row, inRound)).toMatchObject({ scale: 'contest', points: null, max: 250 });
    }
  });
});
