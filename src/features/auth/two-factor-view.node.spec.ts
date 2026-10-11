import { describe, expect, it } from 'vitest';
import type { SecondFactorMethod } from '@/api/types/auth';
import { twoFactorView } from './two-factor-view';
import type { SecondFactorMode } from './two-factor-view';

describe('twoFactorView', () => {
  it.each<[SecondFactorMethod[], boolean, SecondFactorMode, string]>([
    [[], true, 'app', 'sessionChanged'],
    [['totp', 'webauthn'], true, 'app', 'app'],
    [['totp', 'webauthn'], true, 'key', 'key'],
    [['totp', 'webauthn'], false, 'key', 'app'],
    [['totp'], true, 'backup', 'backup'],
    [['totp'], true, 'key', 'app'],
    [['webauthn'], true, 'app', 'key'],
    [['webauthn'], false, 'app', 'keyUnsupported'],
  ])('methods %j, key supported %s, chosen %s -> %s', (methods, keySupported, mode, view) => {
    expect(twoFactorView(methods, keySupported, mode)).toBe(view);
  });
});
