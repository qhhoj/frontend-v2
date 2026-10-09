import { describe, expect, it } from 'vitest';
import { MIB, organizationUsage, quotaMeter } from '@/test/f4-fixtures';
import { ledgerAmountText, ledgerReasonKey, quotaNoticeOf } from './quota-text';

describe('quota notice', () => {
  it('stays quiet below 80 % and warns from 80 %, naming the meter and the percentage', () => {
    expect(
      quotaNoticeOf(
        organizationUsage({ credits: quotaMeter(159, 200), storage: quotaMeter(0, MIB) }),
      ),
    ).toEqual({
      kind: 'healthy',
      meter: null,
      percent: 0,
    });
    expect(
      quotaNoticeOf(
        organizationUsage({ credits: quotaMeter(160, 200), storage: quotaMeter(0, MIB) }),
      ),
    ).toEqual({
      kind: 'near',
      meter: 'credits',
      percent: 80,
    });
  });

  it('blocks only in enforce mode, and prefers the meter that is over', () => {
    const over = { credits: quotaMeter(170, 200), storage: quotaMeter(600 * MIB, 512 * MIB) };
    expect(quotaNoticeOf(organizationUsage({ ...over, enforcing: true }))).toEqual({
      kind: 'blocked',
      meter: 'storage',
      percent: 117,
    });
    expect(quotaNoticeOf(organizationUsage({ ...over, enforcing: false })).kind).toBe('near');
  });

  it('treats a meter at exactly its limit as blocked in enforce mode and near in warn mode', () => {
    const full = { credits: quotaMeter(200, 200), storage: quotaMeter(0, MIB) };
    expect(quotaNoticeOf(organizationUsage({ ...full, enforcing: true })).kind).toBe('blocked');
    expect(quotaNoticeOf(organizationUsage({ ...full, enforcing: false })).kind).toBe('near');
  });

  it('blocks a limit of 0 in enforce mode, used or not, even when the meter flags lag', () => {
    const zero = (used: number) => ({ credits: quotaMeter(used, 0), storage: quotaMeter(0, MIB) });
    for (const used of [0, 5]) {
      const lagging = { ...zero(used).credits, isOver: false, isNearLimit: false };
      expect(
        quotaNoticeOf(
          organizationUsage({ credits: lagging, storage: zero(used).storage, enforcing: true }),
        ),
      ).toMatchObject({ kind: 'blocked', meter: 'credits' });
    }
  });

  it('shows a limit of 0 as blocked from the server flags alone, and not at all in warn mode with no flags', () => {
    const flagged = { used: 0, limit: 0, isOver: true, isNearLimit: true };
    expect(
      quotaNoticeOf(
        organizationUsage({ credits: flagged, storage: quotaMeter(0, MIB), enforcing: true }),
      ),
    ).toMatchObject({ kind: 'blocked', meter: 'credits' });
    expect(
      quotaNoticeOf(
        organizationUsage({ credits: flagged, storage: quotaMeter(0, MIB), enforcing: false }),
      ).kind,
    ).toBe('near');
    const quietZero = { used: 0, limit: 0, isOver: false, isNearLimit: false };
    expect(
      quotaNoticeOf(
        organizationUsage({ credits: quietZero, storage: quotaMeter(0, MIB), enforcing: false }),
      ).kind,
    ).toBe('healthy');
  });

  it('writes a spend as minus and a refund as plus, with a true minus sign', () => {
    expect(ledgerAmountText(10, 'vi')).toBe('−10');
    expect(ledgerAmountText(-10, 'vi')).toBe('+10');
  });

  it('names each ledger reason', () => {
    expect(['problem', 'contest', 'upload', 'refund'].map(ledgerReasonKey)).toEqual([
      'orgQuota.reasons.problem',
      'orgQuota.reasons.contest',
      'orgQuota.reasons.upload',
      'orgQuota.reasons.refund',
    ]);
    expect(ledgerReasonKey('later')).toBe('orgQuota.reasons.other');
  });
});
