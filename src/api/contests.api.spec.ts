import { describe, expect, it } from 'vitest';
import {
  announcement,
  contestDetail,
  contestItem,
  contestStats,
  participationSummary,
  ranking,
} from '@/test/fixtures';
import { mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  fetchContest,
  fetchContestAnnouncements,
  fetchContests,
  fetchContestStats,
  fetchContestSubmissions,
  fetchCurrentParticipation,
  fetchRanking,
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

describe('contest reads', () => {
  it('lists contests with the filters as query parameters', async () => {
    const calls = mockApi({ 'GET /contests': page([contestItem()]) });
    await fetchContests({ phase: 'running', rated: true, search: 'w4', page: 2 });
    expect(calls[0]!.query.get('phase')).toBe('running');
    expect(calls[0]!.query.get('rated')).toBe('true');
    expect(calls[0]!.query.get('search')).toBe('w4');
    expect(calls[0]!.query.get('page')).toBe('2');
  });
  it('reads one contest by its encoded key', async () => {
    const calls = mockApi({ 'GET /contests/a%2Fb': ok(contestDetail()) });
    await fetchContest('a/b');
    expect(calls[0]!.path).toBe('/contests/a%2Fb');
  });
  it('asks the ranking with or without the virtual runs', async () => {
    const calls = mockApi({ 'GET /contests/r42/ranking': ok(ranking()) });
    await fetchRanking('r42', true);
    await fetchRanking('r42', false);
    expect(calls.map((call) => call.query.get('virtual'))).toEqual(['true', 'false']);
  });
  it('reads the current participation, which may be null', async () => {
    const calls = mockApi({ 'GET /contests/current': ok(null) });
    await expect(fetchCurrentParticipation()).resolves.toBeNull();
    expect(calls[0]!.method).toBe('GET');
  });
  it('reads the stats of the encoded key', async () => {
    const calls = mockApi({ 'GET /contests/r%2F42/stats': ok(contestStats()) });
    await fetchContestStats('r/42');
    expect(calls[0]!.path).toBe('/contests/r%2F42/stats');
  });
});
