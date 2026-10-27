import { afterEach, describe, expect, it } from 'vitest';
import { SOCIAL_RETURN_TTL_MS, rememberSocialReturn, takeSocialReturn } from './social-return';

afterEach(() => takeSocialReturn());

describe('social sign-in return path', () => {
  it('gives back the remembered same-origin path once', () => {
    rememberSocialReturn('/contests/x/ranking', 1000);
    expect(takeSocialReturn(2000)).toBe('/contests/x/ranking');
    expect(takeSocialReturn(2000)).toBeNull();
  });

  it.each(['//evil.example', 'https://evil.example', '/\\evil', '/', undefined, ['/a']])(
    'does not keep %j',
    (value) => {
      rememberSocialReturn(value, 1000);
      expect(takeSocialReturn(2000)).toBeNull();
    },
  );

  it('forgets an attempt abandoned long ago', () => {
    rememberSocialReturn('/problems', 1000);
    expect(takeSocialReturn(1000 + SOCIAL_RETURN_TTL_MS + 1)).toBeNull();
  });
});
