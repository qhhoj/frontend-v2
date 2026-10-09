import { describe, expect, it } from 'vitest';
import { mockApi, noContent, ok } from '@/test/mock-api';
import { judge } from '@/test/admin-fixtures/judges';
import {
  createJudge,
  disconnectJudge,
  fetchJudges,
  rotateJudgeKey,
  updateJudge,
} from './judges-admin.api';

describe('judges admin API', () => {
  it('encodes a judge name that has path characters, so it cannot reach another route', async () => {
    const calls = mockApi({ 'PATCH /judges/a%2Fb%20c': ok(judge({ name: 'a/b c' })) });
    await updateJudge('a/b c', { isDisabled: true });
    expect(calls[0]!.path).toBe('/judges/a%2Fb%20c');
    expect(calls[0]!.body).toEqual({ isDisabled: true });
  });

  it('lists the judges with a plain GET', async () => {
    const calls = mockApi({ 'GET /judges': ok([judge()]) });
    await expect(fetchJudges()).resolves.toEqual([judge()]);
    expect(calls[0]!.method).toBe('GET');
    expect(calls[0]!.path).toBe('/judges');
  });

  it('creates a judge from name and description', async () => {
    const answer = { judge: judge(), authKey: 'k' };
    const calls = mockApi({ 'POST /judges': ok(answer) });
    await expect(createJudge({ name: 'j1', description: 'd' })).resolves.toEqual(answer);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.body).toEqual({ name: 'j1', description: 'd' });
  });

  it('rotates a key and disconnects with the force flag, both by encoded name', async () => {
    const calls = mockApi({
      'POST /judges/a%2Fb/key': ok({ authKey: 'new' }),
      'POST /judges/a%2Fb/disconnect': noContent(),
    });
    await rotateJudgeKey('a/b');
    await disconnectJudge('a/b', true);
    expect(calls.map((call) => call.path)).toEqual([
      '/judges/a%2Fb/key',
      '/judges/a%2Fb/disconnect',
    ]);
    expect(calls[0]!.body).toBeUndefined();
    expect(calls[1]!.body).toEqual({ force: true });
  });
});
