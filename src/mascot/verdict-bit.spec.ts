import { describe, expect, it } from 'vitest';
import type { VerdictCode } from '@/lib/verdicts';
import { verdictOf } from '@/lib/verdicts';
import { verdictBitMood } from './verdict-bit';

const moodFor = (code: VerdictCode) =>
  verdictBitMood(verdictOf({ status: 'D', result: code as never }));

describe('verdictBitMood', () => {
  it('crowns an accepted solution', () => {
    expect(moodFor('AC')).toBe('crown');
  });

  it.each(['WA', 'TLE', 'MLE', 'RTE', 'OLE', 'IR', 'CE'] as const)('sweats over %s', (code) =>
    expect(moodFor(code)).toBe('sweat'),
  );

  it.each(['IE', 'AB', 'SC', 'RJ'] as const)('shows nobody for the system outcome %s', (code) =>
    expect(moodFor(code)).toBeNull(),
  );

  it('shows nobody while the submission is still being judged', () => {
    expect(verdictBitMood(verdictOf({ status: 'G', result: null }))).toBeNull();
  });
});
