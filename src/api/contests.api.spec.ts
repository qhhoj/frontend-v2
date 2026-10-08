import { describe, expect, it } from 'vitest';
import { announcement, participationSummary } from '@/test/fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  fetchContestAnnouncements,
  fetchContestSubmissions,
  joinContest,
  leaveContest,
  registerContest,
} from './contests.api';

describe('participation requests', () => {
  it('joins and registers with the access code only when one is given, and encodes the key', async () => {
    const calls = mockApi({
      'POST /contests/a%2Fb/join': ok(participationSummary()),
      'POST /contests/a%2Fb/register': ok(participationSummary({ isRegistered: true })),
    });
    await joinContest('a/b');
    await joinContest('a/b', 'opensesame');
    await registerContest('a/b', 'opensesame');
    expect(calls.map((call) => call.body)).toEqual([
      {},
      { accessCode: 'opensesame' },
      { accessCode: 'opensesame' },
    ]);
  });
  it('leaves with an empty 204', async () => {
    mockApi({ 'POST /contests/r42/leave': noContent() });
    await expect(leaveContest('r42')).resolves.toBeUndefined();
  });
});

describe('contest lists', () => {
  it('asks one announcement page of the fixed size', async () => {
    const calls = mockApi({ 'GET /contests/r42/announcements': page([announcement(1)]) });
    const result = await fetchContestAnnouncements('r42', 2);
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('pageSize')).toBe('20');
    expect(result.items[0]!.title).toBe(announcement(1).title);
  });
  it('sends repeated status filters to the contest submission list', async () => {
    const calls = mockApi({ 'GET /contests/r42/submissions': page([]) });
    await fetchContestSubmissions('r42', { status: ['QU', 'P', 'G'], page: 1 });
    expect(calls[0]!.query.getAll('status')).toEqual(['QU', 'P', 'G']);
  });
});
