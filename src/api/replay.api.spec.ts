import { describe, expect, it } from 'vitest';
import { fail, mockApi, ok } from '@/test/mock-api';
import type { ApiCall, MockHandler } from '@/test/mock-api';
import { REPLAY_BUILD_ID, REPLAY_EVENTS, buildingChunk, replayChunk } from '@/test/replay-fixtures';
import { asReplayEvent, loadReplay, rebuildReplay } from './replay.api';

const ROUTE = 'GET /contests/r41/replay';
const OTHER_BUILD = '0192a000-0000-7000-8000-00000000b002';
const chunkOf = (call: ApiCall) => Number(call.query.get('chunk'));
const chunkAndBuild = (calls: ApiCall[]) =>
  calls.map((call) => [call.query.get('chunk'), call.query.get('build')]);
/** Chunk n of a build of `count` chunks, carrying the n-th fixture event; the lists only in chunk 0. */
const chunkReply = (call: ApiCall, count: number, buildId = REPLAY_BUILD_ID) => {
  const chunk = chunkOf(call);
  const lists = chunk === 0 ? {} : { participants: null, problems: null, ghosts: null };
  return ok(
    replayChunk({ chunk, chunkCount: count, buildId, events: [REPLAY_EVENTS[chunk]!], ...lists }),
  );
};

describe('loadReplay', () => {
  it('reads chunk 0, then every later chunk pinned to its build, and joins the events in order', async () => {
    const calls = mockApi({ [ROUTE]: (call) => chunkReply(call, 3) });
    const load = await loadReplay('r41');
    expect(chunkAndBuild(calls)).toEqual([
      ['0', null],
      ['1', REPLAY_BUILD_ID],
      ['2', REPLAY_BUILD_ID],
    ]);
    if (load.state !== 'ready') throw new Error('expected a ready replay');
    expect(load.replay.events.map((event) => event[0])).toEqual([300, 540, 720]);
    expect(load.replay.participants.map((row) => row.user.username)).toEqual([
      'user_07',
      'user_12',
      'user_01',
      'user_03',
    ]);
    expect(load.replay.ghosts.map((ghost) => ghost.events.length)).toEqual([2, 0]);
  });

  it('answers building after chunk 0 and asks for nothing more', async () => {
    const calls = mockApi({ [ROUTE]: { status: 202, body: { data: buildingChunk() } } });
    expect(await loadReplay('r41')).toEqual({ state: 'building' });
    expect(calls).toHaveLength(1);
  });

  it('restarts once from chunk 0 when the build changes mid-read, and keeps only the new build', async () => {
    let reads = 0;
    const handler: MockHandler = (call) => {
      reads += 1;
      if (reads === 1) return chunkReply(call, 2);
      if (reads === 2) return fail(409, 'replay_changed');
      return chunkReply(call, 1, OTHER_BUILD);
    };
    const calls = mockApi({ [ROUTE]: handler });
    const load = await loadReplay('r41');
    expect(chunkAndBuild(calls)).toEqual([
      ['0', null],
      ['1', REPLAY_BUILD_ID],
      ['0', null],
    ]);
    expect(load.state === 'ready' && load.replay.buildId).toBe(OTHER_BUILD);
    expect(load.state === 'ready' && load.replay.events).toHaveLength(1);
  });

  it('gives up with replay_changed when the build changes twice', async () => {
    const calls = mockApi({
      [ROUTE]: (call) => (chunkOf(call) === 0 ? chunkReply(call, 2) : fail(409, 'replay_changed')),
    });
    await expect(loadReplay('r41')).rejects.toMatchObject({ code: 'replay_changed', status: 409 });
    expect(calls).toHaveLength(4);
  });

  it('passes the gate refusals through untouched', async () => {
    mockApi({ [ROUTE]: fail(403, 'forbidden') });
    await expect(loadReplay('r41')).rejects.toMatchObject({ code: 'forbidden', status: 403 });
    mockApi({ [ROUTE]: fail(404, 'replay_not_ready') });
    await expect(loadReplay('r41')).rejects.toMatchObject({ code: 'replay_not_ready' });
  });

  it('refuses a malformed event instead of drawing it', async () => {
    mockApi({ [ROUTE]: ok(replayChunk({ events: [[300, 0, 0, {}, 1, 5]] })) });
    await expect(loadReplay('r41')).rejects.toMatchObject({ code: 'invalid_response' });
  });
});

describe('asReplayEvent', () => {
  it('keeps a well-formed tuple and refuses a short one, a string number and a missing cell', () => {
    expect(asReplayEvent([60, 1, 0, { points: 1 }, 1, 1, 0])).toEqual([
      60,
      1,
      0,
      { points: 1 },
      1,
      1,
      0,
    ]);
    expect(() => asReplayEvent([60, 1, 0, { points: 1 }, 1, 1])).toThrow('Malformed replay event');
    expect(() => asReplayEvent([60, 1, 0, { points: 1 }, 1, 1, 0, 9])).toThrow(
      'Malformed replay event',
    );
    expect(() => asReplayEvent(['60', 1, 0, {}, 1, 1, 0])).toThrow('Malformed replay event');
    expect(() => asReplayEvent([60, 1, 0, null, 1, 1, 0])).toThrow('Malformed replay event');
    expect(() => asReplayEvent([60, 1, 0, [1], 1, 1, 0])).toThrow('Malformed replay event');
  });
});

describe('rebuildReplay', () => {
  it('posts to the rebuild route of the encoded key', async () => {
    const calls = mockApi({
      'POST /contests/a%20b/replay/rebuild': { status: 202, body: { data: { queued: true } } },
    });
    expect(await rebuildReplay('a b')).toEqual({ queued: true });
    expect(calls.map((call) => [call.method, call.path])).toEqual([
      ['POST', '/contests/a%20b/replay/rebuild'],
    ]);
  });
});
