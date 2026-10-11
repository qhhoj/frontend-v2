import { describe, expect, it } from 'vitest';
import type { ContestActionKind } from './contest-action';
import { needsRulesAcceptance, rulesExcerpt } from './join-rules';

const ALL_KINDS: ContestActionKind[] = [
  'signIn',
  'join',
  'rejoin',
  'register',
  'registered',
  'spectate',
  'virtual',
  'leave',
  'finished',
  'opensLater',
  'registrationClosed',
  'virtualDisallowed',
];

describe('join rules', () => {
  it('asks for acceptance exactly where the backend creates a row', () => {
    const asking = ALL_KINDS.filter((kind) => needsRulesAcceptance(kind, null));
    expect(asking).toEqual(['join', 'register', 'virtual']);
  });

  it('does not ask a registered contestant who joins, nor anyone re-entering', () => {
    expect(needsRulesAcceptance('join', 'registered')).toBe(false);
    expect(needsRulesAcceptance('rejoin', 'participating')).toBe(false);
    expect(needsRulesAcceptance('finished', 'finished')).toBe(false);
    expect(needsRulesAcceptance('virtual', 'finished')).toBe(true);
  });

  it('turns the rules into one short plain line for the card', () => {
    expect(rulesExcerpt('# 1. Trung thực\n\n- **Tự làm bài**, không trao đổi.\n')).toBe(
      'Trung thực · Tự làm bài, không trao đổi.',
    );
    const long = rulesExcerpt('a'.repeat(300), 20);
    expect(Array.from(long)).toHaveLength(20);
    expect(long.endsWith('…')).toBe(true);
  });
});
