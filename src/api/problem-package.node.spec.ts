import { afterEach, describe, expect, it, vi } from 'vitest';
import { failureTextOf } from '@/features/admin/ui/admin-errors';
import { ApiError } from './client';
import { probePackage } from './problem-package.api';

afterEach(() => vi.unstubAllGlobals());

describe('probePackage', () => {
  it('names a 409 package_data_unsaved, not the generic failure', async () => {
    const body = JSON.stringify({ error: { code: 'package_data_unsaved' } });
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body, { status: 409 })));
    await expect(probePackage('cuvui')).resolves.toMatchObject({
      state: 'failed',
      reason: 'package_data_unsaved',
    });
  });
});

describe('package request refusals', () => {
  it('tells the editor to save the data again for data_save_unfinished and names a too-large package', () => {
    const unsaved = new ApiError('conflict', 409, 'unsaved', {
      issues: [{ field: 'data', code: 'data_save_unfinished', message: 'unsaved' }],
    });
    expect(failureTextOf(unsaved)).toContain('lưu lại dữ liệu test');
    expect(failureTextOf(new ApiError('package_too_large', 409, 'big'))).toContain('512 MiB');
  });
});
