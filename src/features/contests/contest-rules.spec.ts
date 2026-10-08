import { describe, expect, it } from 'vitest';
import { contestDetail } from '@/test/fixtures';
import { contestRules } from './contest-rules';
import type { RuleRow } from './contest-rules';

const ruleFor = (rows: RuleRow[], termKey: string) => rows.find((row) => row.termKey === termKey);
const termsOf = (rows: RuleRow[]) => rows.map((row) => row.termKey);

describe('contest rules', () => {
  it('names the format with its penalty, the default one when the contest never set it', () => {
    expect(ruleFor(contestRules(contestDetail(), 'vi'), 'contests.rules.format')).toEqual({
      termKey: 'contests.rules.format',
      valueKey: 'contests.rules.formatWithPenalty',
      params: { format: 'ICPC', minutes: 20 },
    });
  });

  it('reads the penalty the contest stored over the format default', () => {
    const stored = contestDetail({ formatName: 'vnoj', formatConfig: { penalty: 10 } });
    expect(ruleFor(contestRules(stored, 'vi'), 'contests.rules.format')!.params.minutes).toBe(10);
  });

  it('names a format without a penalty by its name alone', () => {
    const ioi = contestDetail({ formatName: 'ioi' });
    expect(ruleFor(contestRules(ioi, 'vi'), 'contests.rules.format')!.valueKey).toBe(
      'contests.rules.formatOnly',
    );
  });

  it('adds the freeze to the scoreboard rule only for formats that freeze', () => {
    expect(ruleFor(contestRules(contestDetail(), 'vi'), 'contests.rules.scoreboard')).toMatchObject(
      {
        valueKey: 'contests.rules.scoreboardFrozen',
        params: { minutes: 60 },
        paramKeys: { visibility: 'contests.rules.visibility.V' },
      },
    );
    const ioi = contestDetail({ formatName: 'ioi', scoreboardVisibility: 'C' });
    expect(ruleFor(contestRules(ioi, 'vi'), 'contests.rules.scoreboard')).toMatchObject({
      valueKey: 'contests.rules.visibility.C',
    });
  });

  it('lists the time per participation and the registration window only when the contest has them', () => {
    const plain = termsOf(contestRules(contestDetail(), 'vi'));
    expect(plain).not.toContain('contests.rules.timeLimit');
    expect(plain).not.toContain('contests.rules.registration');
    const timed = contestRules(
      contestDetail({ timeLimit: 3 * 3600, registrationEnd: '2026-10-08T07:00:00Z' }),
      'vi',
    );
    expect(ruleFor(timed, 'contests.rules.timeLimit')!.params).toEqual({ count: 3 });
    expect(ruleFor(timed, 'contests.rules.timeLimit')!.suffixKey).toBe(
      'contests.rules.perParticipation',
    );
    expect(ruleFor(timed, 'contests.rules.registration')!.valueKey).toBe(
      'contests.rules.registrationUntil',
    );
  });
});
