import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { editableContest } from '@/test/admin-fixtures/contests';
import { cloneContest, updateContest } from './contest-editing.api';

describe('contest editing API', () => {
  it('keeps an explicit null in a PATCH body, so a cleared nullable field reaches the backend', async () => {
    const calls = mockApi({ 'PATCH /contests/hcmus-w41': ok(editableContest()) });
    await updateContest('hcmus-w41', { timeLimit: null });
    expect(calls[0]!.body).toEqual({ timeLimit: null });
  });

  it('posts the new key to clone and answers the clone', async () => {
    const calls = mockApi({
      'POST /contests/hcmus-w41/clone': ok(editableContest({ key: 'hcmus-w42' })),
    });
    const clone = await cloneContest('hcmus-w41', 'hcmus-w42');
    expect(calls[0]!.body).toEqual({ key: 'hcmus-w42' });
    expect(clone.key).toBe('hcmus-w42');
  });
});
