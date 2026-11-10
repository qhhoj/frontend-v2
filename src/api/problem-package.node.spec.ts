import { afterEach, describe, expect, it, vi } from 'vitest';
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
