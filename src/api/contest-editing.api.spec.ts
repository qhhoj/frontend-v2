import { describe, expect, it } from 'vitest';
import { fail, mockApi, noContent, ok, page } from '@/test/mock-api';
import {
  announcement,
  contestActions,
  contestDataStatus,
  editableContest,
  officialRanking,
  participation,
  rankingLink,
} from '@/test/admin-fixtures/contests';
import {
  cloneContest,
  contestDataDownloadUrl,
  createContest,
  createRankingLink,
  deleteAnnouncement,
  deleteOfficialRanking,
  fetchAnnouncements,
  fetchContestActions,
  fetchContestData,
  fetchEditableContest,
  fetchOfficialRanking,
  fetchParticipations,
  fetchRankingLink,
  judgeFinal,
  postAnnouncement,
  prepareContestData,
  putOfficialRanking,
  rateContest,
  regenerateRankingLink,
  rescoreContest,
  resendAnnouncement,
  setDisqualified,
  updateContest,
  updateRankingLink,
} from './contest-editing.api';

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

  it('reads and creates a contest', async () => {
    const calls = mockApi({
      'GET /contests/a%2Fb': ok(editableContest()),
      'POST /contests': ok(editableContest()),
    });
    await fetchEditableContest('a/b');
    await createContest({ key: 'k1', name: 'N', startTime: 'a', endTime: 'b' });
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /contests/a%2Fb',
      'POST /contests',
    ]);
    expect(calls[1]!.body).toEqual({ key: 'k1', name: 'N', startTime: 'a', endTime: 'b' });
  });

  it('pages, posts, resends and deletes announcements of an encoded key and id', async () => {
    const calls = mockApi({
      'GET /contests/a%2Fb/announcements': page([announcement()]),
      'POST /contests/a%2Fb/announcements': ok(announcement()),
      'POST /contests/a%2Fb/announcements/i%2F1/resend': noContent(),
      'DELETE /contests/a%2Fb/announcements/i%2F1': noContent(),
    });
    await fetchAnnouncements('a/b', 3);
    await postAnnouncement('a/b', { title: 'T', description: 'D' });
    await resendAnnouncement('a/b', 'i/1');
    await deleteAnnouncement('a/b', 'i/1');
    expect(calls[0]!.query.get('page')).toBe('3');
    expect(calls[0]!.query.get('pageSize')).toBe('20');
    expect(calls[1]!.body).toEqual({ title: 'T', description: 'D' });
    expect(calls.slice(2).map((call) => call.method)).toEqual(['POST', 'DELETE']);
  });

  it('reads the official ranking, null on a 404, and puts or deletes it', async () => {
    const calls = mockApi({
      'GET /contests/k1/official-ranking': ok(officialRanking()),
      'PUT /contests/k1/official-ranking': ok(officialRanking()),
      'DELETE /contests/k1/official-ranking': noContent(),
    });
    await fetchOfficialRanking('k1');
    await putOfficialRanking('k1', { csv: 'a,b' });
    await deleteOfficialRanking('k1');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'PUT', 'DELETE']);
    expect(calls[1]!.body).toEqual({ csv: 'a,b' });
    mockApi({ 'GET /contests/k1/official-ranking': fail(404, 'not_found') });
    await expect(fetchOfficialRanking('k1')).resolves.toBeNull();
  });

  it('manages the ranking link, reading a missing one as null', async () => {
    const calls = mockApi({
      'GET /contests/k1/ranking-link': ok(rankingLink()),
      'POST /contests/k1/ranking-link': ok(rankingLink()),
      'PATCH /contests/k1/ranking-link': ok(rankingLink()),
      'POST /contests/k1/ranking-link/regenerate': ok(rankingLink()),
    });
    await fetchRankingLink('k1');
    await createRankingLink('k1');
    await updateRankingLink('k1', { status: 'private', expiryMode: 'M', expiryAmount: 5 });
    await regenerateRankingLink('k1');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /contests/k1/ranking-link',
      'POST /contests/k1/ranking-link',
      'PATCH /contests/k1/ranking-link',
      'POST /contests/k1/ranking-link/regenerate',
    ]);
    expect(calls[2]!.body).toEqual({ status: 'private', expiryMode: 'M', expiryAmount: 5 });
    mockApi({ 'GET /contests/k1/ranking-link': fail(404, 'not_found') });
    await expect(fetchRankingLink('k1')).resolves.toBeNull();
  });

  it('queues rescore, final judging and rating, and reads their state', async () => {
    const calls = mockApi({
      'POST /contests/k1/rescore': ok({ queued: true }),
      'POST /contests/k1/judge-final': ok({ queued: true }),
      'POST /contests/k1/rate': ok({ queued: true }),
      'GET /contests/k1/actions': ok(contestActions()),
    });
    await rescoreContest('k1');
    await judgeFinal('k1');
    await rateContest('k1');
    await fetchContestActions('k1');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'POST /contests/k1/rescore',
      'POST /contests/k1/judge-final',
      'POST /contests/k1/rate',
      'GET /contests/k1/actions',
    ]);
  });

  it('reads, prepares and links the data export', async () => {
    const calls = mockApi({
      'GET /contests/a%2Fb/data': ok(contestDataStatus()),
      'POST /contests/a%2Fb/data': ok({ queued: true }),
    });
    await fetchContestData('a/b');
    await prepareContestData('a/b', { problemGlob: 'p*', results: ['AC'] });
    expect(calls[1]!.body).toEqual({ problemGlob: 'p*', results: ['AC'] });
    expect(contestDataDownloadUrl('a/b')).toBe('/api/internal/contests/a%2Fb/data/download');
  });

  it('pages participations with the page size and disqualifies one', async () => {
    const calls = mockApi({
      'GET /contests/k1/participations': page([participation()]),
      'POST /contests/k1/participations/p%2F1/disqualify': ok(participation()),
    });
    await fetchParticipations('k1', { page: 2, user: 'ann' });
    await setDisqualified('k1', 'p/1', true);
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('user')).toBe('ann');
    expect(calls[0]!.query.get('pageSize')).toBe('50');
    expect(calls[1]!.body).toEqual({ disqualified: true });
  });
});
