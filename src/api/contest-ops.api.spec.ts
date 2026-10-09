import { describe, expect, it } from 'vitest';
import {
  contestExportStatus,
  feedKeyStatus,
  mintedFeedKey,
  publishResult,
} from '@/test/contest-extras-fixtures';
import { mockApi, noContent, ok } from '@/test/mock-api';
import {
  contestExportDownloadUrl,
  contestFeedStreamUrl,
  contestFeedUrl,
  fetchContestExport,
  fetchFeedKey,
  mintFeedKey,
  prepareContestExport,
  publishProblems,
  releaseFeedKey,
  revokeFeedKey,
} from './contest-ops.api';

describe('contest operation calls', () => {
  it('publishes with the editorial and dry-run choices in the body', async () => {
    const calls = mockApi({ 'POST /contests/r42/publish-problems': ok(publishResult([], true)) });
    await publishProblems('r42', { editorials: true, dryRun: true });
    expect(calls[0]!.body).toEqual({ editorials: true, dryRun: true });
  });

  it('reads, mints, revokes and releases the feed key on its own routes', async () => {
    const calls = mockApi({
      'GET /contests/r42/feed-key': ok(feedKeyStatus()),
      'POST /contests/r42/feed-key': ok(mintedFeedKey()),
      'DELETE /contests/r42/feed-key': noContent(),
      'POST /contests/r42/feed-key/release': noContent(),
    });
    await fetchFeedKey('r42');
    await mintFeedKey('r42', { mode: 'live', expiresInDays: 3 });
    await revokeFeedKey('r42');
    await releaseFeedKey('r42');
    expect(calls.map((call) => `${call.method} ${call.path}`)).toEqual([
      'GET /contests/r42/feed-key',
      'POST /contests/r42/feed-key',
      'DELETE /contests/r42/feed-key',
      'POST /contests/r42/feed-key/release',
    ]);
    expect(calls[1]!.body).toEqual({ mode: 'live', expiresInDays: 3 });
  });

  it('reads and queues the export, and builds the download and feed addresses', async () => {
    const calls = mockApi({
      'GET /contests/a%2Fb/export': ok(contestExportStatus()),
      'POST /contests/a%2Fb/export': { status: 202, body: { data: { queued: true } } },
    });
    await fetchContestExport('a/b');
    await prepareContestExport('a/b');
    expect(calls.map((call) => call.method)).toEqual(['GET', 'POST']);
    expect(contestExportDownloadUrl('a/b')).toBe('/api/internal/contests/a%2Fb/export/download');
    expect(contestFeedUrl('r42')).toBe('/api/internal/contests/r42/feed');
    expect(contestFeedStreamUrl('r42')).toBe('/api/internal/events/contests/r42/feed');
  });
});
