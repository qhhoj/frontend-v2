import { describe, expect, it } from 'vitest';
import { profile } from '@/test/fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { fetchProfile, updateProfile } from './profile.api';

describe('profile calls', () => {
  it('reads the profile of the signed-in user', async () => {
    const calls = mockApi({ 'GET /profile': ok(profile({ firstName: 'Ada' })) });
    await expect(fetchProfile()).resolves.toMatchObject({ firstName: 'Ada' });
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.path).toBe('/profile');
  });

  it('patches only the fields it is given and returns the stored profile', async () => {
    const calls = mockApi({
      'PATCH /profile': ok(profile({ timezone: 'Asia/Ho_Chi_Minh' })),
    });
    const saved = await updateProfile({
      timezone: 'Asia/Ho_Chi_Minh',
      appearance: { accent: 'ocean', glass: 50, glow: 100 },
    });
    expect(calls[0]!.method).toBe('PATCH');
    expect(calls[0]!.path).toBe('/profile');
    expect(calls[0]!.body).toEqual({
      timezone: 'Asia/Ho_Chi_Minh',
      appearance: { accent: 'ocean', glass: 50, glow: 100 },
    });
    expect(saved.timezone).toBe('Asia/Ho_Chi_Minh');
  });
});
