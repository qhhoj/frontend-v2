import { describe, expect, it } from 'vitest';
import type { VerdictCode } from '@/lib/verdicts';
import { verdictOf } from '@/lib/verdicts';
import { verdictBitLook } from './verdict-bit';

const headgearFor = (code: VerdictCode) =>
  verdictBitLook(verdictOf({ status: 'D', result: code as never }))?.headgear ?? null;

describe('verdictBitLook', () => {
  it('crowns an accepted solution', () => {
    expect(headgearFor('AC')).toBe('crown');
  });

  it.each(['WA', 'TLE', 'MLE', 'RTE', 'OLE', 'IR', 'CE'] as const)('sweats over %s', (code) =>
    expect(headgearFor(code)).toBe('sweat'),
  );

  it.each(['IE', 'AB', 'SC', 'RJ'] as const)('shows nobody for the system outcome %s', (code) =>
    expect(headgearFor(code)).toBeNull(),
  );

  it('shows nobody while the submission is still being judged', () => {
    expect(verdictBitLook(verdictOf({ status: 'G', result: null }))).toBeNull();
  });
});
