import { describe, expect, it } from 'vitest';
import { MIB } from '@/test/f4-fixtures';
import { quotaBodyOf, quotaFormErrors, quotaFormOf } from './quota-form';

describe('quota form', () => {
  it('shows an override as a number and the site default as an empty box (storage in MiB)', () => {
    expect(quotaFormOf({ monthlyCredits: 300, storageBytes: 1024 * MIB })).toEqual({
      credits: '300',
      storageMib: '1024',
    });
    expect(quotaFormOf({ monthlyCredits: null, storageBytes: null })).toEqual({
      credits: '',
      storageMib: '',
    });
  });

  it('sends only what changed: an emptied box is null, MiB become bytes', () => {
    const original = { credits: '300', storageMib: '' };
    expect(quotaBodyOf({ credits: '300', storageMib: '' }, original)).toEqual({});
    expect(quotaBodyOf({ credits: '', storageMib: '1024' }, original)).toEqual({
      quotaMonthlyCredits: null,
      quotaStorageBytes: 1024 * MIB,
    });
  });

  it('accepts whole numbers within the backend limits only', () => {
    expect(quotaFormErrors({ credits: '200', storageMib: '' })).toEqual({});
    expect(quotaFormErrors({ credits: '-5', storageMib: '1.5' })).toEqual({
      credits: 'admin.quota.errors.credits',
      storageMib: 'admin.quota.errors.storage',
    });
    expect(quotaFormErrors({ credits: '1000001', storageMib: '1048577' })).toEqual({
      credits: 'admin.quota.errors.credits',
      storageMib: 'admin.quota.errors.storage',
    });
  });
});
