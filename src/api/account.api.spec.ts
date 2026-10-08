import { describe, expect, it } from 'vitest';
import { mockApi, noContent, ok } from '@/test/mock-api';
import type { MockHandler } from '@/test/mock-api';
import * as account from './account.api';

/** Each call, the request it must send, and the body it must carry. */
const CALLS: ReadonlyArray<readonly [string, () => Promise<unknown>, string, unknown]> = [
  [
    'enrollTotp',
    () => account.enrollTotp('pw'),
    'POST /auth/2fa/totp/enroll',
    { currentPassword: 'pw' },
  ],
  [
    'confirmTotp',
    () => account.confirmTotp('123456'),
    'POST /auth/2fa/totp/confirm',
    { code: '123456' },
  ],
  [
    'disableTotp',
    () => account.disableTotp('123456'),
    'POST /auth/2fa/totp/disable',
    { code: '123456' },
  ],
  [
    'regenerateScratchCodes',
    () => account.regenerateScratchCodes('123456'),
    'POST /auth/2fa/totp/scratch-codes',
    { code: '123456' },
  ],
  [
    'securityKeyCreationOptions',
    () => account.securityKeyCreationOptions('pw'),
    'POST /auth/2fa/webauthn/register/options',
    { currentPassword: 'pw' },
  ],
  [
    'verifySecurityKey',
    () => account.verifySecurityKey('YubiKey', { id: 'cred' }),
    'POST /auth/2fa/webauthn/register/verify',
    { name: 'YubiKey', response: { id: 'cred' } },
  ],
  [
    'removeSecurityKey',
    () => account.removeSecurityKey('key-1', 'pw'),
    'DELETE /auth/2fa/webauthn/credentials/key-1',
    { currentPassword: 'pw' },
  ],
  [
    'regenerateApiToken',
    () => account.regenerateApiToken(),
    'POST /auth/token/regenerate',
    undefined,
  ],
  [
    'fetchScratchCodesRemaining',
    () => account.fetchScratchCodesRemaining(),
    'GET /auth/2fa/totp/scratch-codes',
    undefined,
  ],
  [
    'fetchSecurityKeys',
    () => account.fetchSecurityKeys(),
    'GET /auth/2fa/webauthn/credentials',
    undefined,
  ],
  ['fetchDataExportStatus', () => account.fetchDataExportStatus(), 'GET /profile/data', undefined],
  ['requestDataExport', () => account.requestDataExport(), 'POST /profile/data', undefined],
];

describe('account API', () => {
  it.each(CALLS)('%s sends the backend request', async (_name, call, route, body) => {
    const calls = mockApi({ [route]: ok({}) });
    await call();
    expect(`${calls[0]!.method} ${calls[0]!.path}`).toBe(route);
    expect(calls[0]!.body).toEqual(body);
  });

  it('returns what the backend sends, and nothing for a 204', async () => {
    const routes: Record<string, MockHandler> = {
      'POST /auth/2fa/totp/enroll': ok({
        secret: 'JBSWY3DP',
        otpauthUrl: 'otpauth://totp/QHHOJ:user_01',
      }),
      'POST /auth/2fa/totp/disable': noContent(),
    };
    mockApi(routes);
    await expect(account.enrollTotp('pw')).resolves.toEqual({
      secret: 'JBSWY3DP',
      otpauthUrl: 'otpauth://totp/QHHOJ:user_01',
    });
    await expect(account.disableTotp('123456')).resolves.toBeUndefined();
  });

  it('encodes a key id that is not URL-safe into one path segment', async () => {
    const calls = mockApi({ 'DELETE /auth/2fa/webauthn/credentials/a%2Fb': noContent() });
    await account.removeSecurityKey('a/b', 'pw');
    expect(calls[0]!.path).toBe('/auth/2fa/webauthn/credentials/a%2Fb');
  });

  it('downloads the export from the API base, never through fetch', () => {
    expect(account.DATA_EXPORT_DOWNLOAD_URL).toBe('/api/internal/profile/data/download');
  });
});
