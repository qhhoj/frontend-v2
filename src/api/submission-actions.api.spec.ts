import { describe, expect, it } from 'vitest';
import { mockApi, noContent, ok } from '@/test/mock-api';
import {
  abortSubmission,
  rejectSubmission,
  rejudgeSubmission,
  rejudgeSubmissions,
} from './submission-actions.api';

describe('submission action calls', () => {
  it('aborts, rejudges and rejects one submission by its encoded id with no body', async () => {
    const calls = mockApi({
      'POST /submissions/s%2F1/abort': noContent(),
      'POST /submissions/s%2F1/rejudge': noContent(),
      'POST /submissions/s%2F1/reject': noContent(),
    });
    await abortSubmission('s/1');
    await rejudgeSubmission('s/1');
    await rejectSubmission('s/1');
    expect(calls.map((call) => call.path)).toEqual([
      '/submissions/s%2F1/abort',
      '/submissions/s%2F1/rejudge',
      '/submissions/s%2F1/reject',
    ]);
    expect(calls.every((call) => call.method === 'POST' && call.body === undefined)).toBe(true);
  });

  it('posts a bulk rejudge filter as the body and returns the count answer', async () => {
    const answer = { count: 3, dryRun: true, allowed: true };
    const calls = mockApi({ 'POST /submissions/rejudge': ok(answer) });
    const body = { problem: 'p1', languages: ['CPP20'], dryRun: true };
    await expect(rejudgeSubmissions(body)).resolves.toEqual(answer);
    expect(calls[0]!.method).toBe('POST');
    expect(calls[0]!.path).toBe('/submissions/rejudge');
    expect(calls[0]!.body).toEqual(body);
  });
});
