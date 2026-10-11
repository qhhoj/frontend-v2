import { describe, expect, it } from 'vitest';
import { MIB } from '@/test/f4-fixtures';
import { quotaBodyOf, quotaFormErrors } from './quota-form';

describe('quota form', () => {
  it('sends only what changed: an emptied box is null, MiB become bytes', () => {
    const original = { credits: '300', storageMib: '', unlimited: false };
    expect(quotaBodyOf({ ...original }, original)).toEqual({});
    expect(quotaBodyOf({ credits: '', storageMib: '1024', unlimited: false }, original)).toEqual({
      quotaMonthlyCredits: null,
      quotaStorageBytes: 1024 * MIB,
    });
  });

  it('sends the promotion toggle only when it was flipped', () => {
    const original = { credits: '', storageMib: '', unlimited: true };
    expect(quotaBodyOf({ ...original }, original)).toEqual({});
    expect(quotaBodyOf({ ...original, unlimited: false }, original)).toEqual({
      quotaUnlimited: false,
    });
  });

  it('accepts whole numbers within the backend limits only', () => {
    expect(quotaFormErrors({ credits: '200', storageMib: '', unlimited: false })).toEqual({});
    expect(quotaFormErrors({ credits: '-5', storageMib: '1.5', unlimited: false })).toEqual({
      credits: 'admin.quota.errors.credits',
      storageMib: 'admin.quota.errors.storage',
    });
    expect(
      quotaFormErrors({ credits: '1000001', storageMib: '1048577', unlimited: false }),
    ).toEqual({
      credits: 'admin.quota.errors.credits',
      storageMib: 'admin.quota.errors.storage',
    });
  });
});
