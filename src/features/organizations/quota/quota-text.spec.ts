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
