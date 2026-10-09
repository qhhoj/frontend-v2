import { describe, expect, it } from 'vitest';
import { homeResponse } from '@/test/community-fixtures';
import { mockApi, ok } from '@/test/mock-api';
import { fetchHome, fetchHomeCounts } from './home.api';

describe('home calls', () => {
  it('reads the whole home page from GET /home', async () => {
    const calls = mockApi({ 'GET /home': ok(homeResponse()) });
    const home = await fetchHome();
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual(['GET /home']);
    expect(home.counts).toEqual(homeResponse().counts);
  });

  it('returns only the counts for the sign-in screen', async () => {
    const calls = mockApi({ 'GET /home': ok(homeResponse()) });
    expect(await fetchHomeCounts()).toEqual(homeResponse().counts);
    expect(calls).toHaveLength(1);
  });
});
