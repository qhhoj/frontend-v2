import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { judge } from '@/test/admin-fixtures/judges';
import { updateJudge } from './judges-admin.api';

describe('judges admin API', () => {
  it('encodes a judge name that has path characters, so it cannot reach another route', async () => {
    const calls = mockApi({ 'PATCH /judges/a%2Fb%20c': ok(judge({ name: 'a/b c' })) });
    await updateJudge('a/b c', { isDisabled: true });
    expect(calls[0]!.path).toBe('/judges/a%2Fb%20c');
    expect(calls[0]!.body).toEqual({ isDisabled: true });
  });
});
