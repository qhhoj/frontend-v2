import { describe, expect, it } from 'vitest';
import { ApiError } from '@/api/client';
import type { ReplayLoad } from '@/api/types/replay';
import { endedContest, loadedReplay } from '@/test/replay-fixtures';
import { replayViewState } from './replay-state';
import type { ReplayStateInput } from './replay-state';

const ready: ReplayLoad = { state: 'ready', replay: loadedReplay() };
const input = (overrides: Partial<ReplayStateInput> = {}): ReplayStateInput => ({
  contest: endedContest(),
  error: null,
  load: ready,
  ...overrides,
});
const refused = (status: number, code: string, issueCode?: string) =>
  new ApiError(
    code,
    status,
    code,
    issueCode ? { issues: [{ field: 'board', code: issueCode, message: 'x' }] } : {},
  );

describe('replayViewState', () => {
  it.each([
    ['ready', input()],
    ['loading', input({ load: undefined })],
    ['building', input({ load: { state: 'building' } })],
    [
      'empty',
      input({
        load: {
          state: 'ready',
          replay: loadedReplay({ participants: [], ghosts: [], events: [] }),
        },
      }),
    ],
    [
      'unsupported',
      input({ contest: endedContest({ formatName: 'final_submission' }), load: undefined }),
    ],
    ['notEnded', input({ contest: endedContest({ phase: 'running' }), load: undefined })],
    [
      'frozen',
      input({
        contest: endedContest({ frozenLastMinutes: 60 }),
        error: refused(403, 'forbidden'),
        load: undefined,
      }),
    ],
    ['forbidden', input({ error: refused(403, 'forbidden'), load: undefined })],
    [
      'forbidden',
      input({
        contest: endedContest({ formatName: 'ioi', frozenLastMinutes: 60 }),
        error: refused(403, 'forbidden'),
        load: undefined,
      }),
    ],
    [
      'frozen',
      input({
        contest: endedContest({ formatName: 'ioi' }),
        error: refused(403, 'forbidden', 'board_frozen'),
        load: undefined,
      }),
    ],
    [
      'forbidden',
      input({
        contest: endedContest({ frozenLastMinutes: 60 }),
        error: refused(403, 'forbidden', 'board_hidden'),
        load: undefined,
      }),
    ],
    ['notReady', input({ error: refused(404, 'replay_not_ready'), load: undefined })],
    ['notEnded', input({ error: refused(409, 'contest_not_ended'), load: undefined })],
    ['unsupported', input({ error: refused(409, 'replay_unsupported'), load: undefined })],
    ['error', input({ error: refused(409, 'replay_changed'), load: undefined })],
    ['error', input({ error: new Error('offline'), load: undefined })],
  ] as const)('shows %s', (expected, given) => {
    expect(replayViewState(given)).toBe(expected);
  });

  it('keeps showing the last ready board when a background read fails on the network or the server', () => {
    expect(replayViewState(input({ error: refused(500, 'generic') }))).toBe('ready');
    expect(replayViewState(input({ error: new Error('offline') }))).toBe('ready');
    expect(replayViewState(input({ error: refused(429, 'rate_limited') }))).toBe('ready');
    expect(replayViewState(input({ error: refused(401, 'unauthorized') }))).toBe('ready');
    expect(
      replayViewState(input({ error: refused(429, 'rate_limited'), load: { state: 'building' } })),
    ).toBe('building');
  });

  it.each([
    ['frozen', 'board_frozen'],
    ['forbidden', 'board_hidden'],
  ] as const)(
    'drops a loaded board for the %s panel when a later read is refused with %s',
    (expected, reason) => {
      expect(replayViewState(input({ error: refused(403, 'forbidden', reason) }))).toBe(expected);
    },
  );

  it('drops a loaded board for any other refusal of the gate too', () => {
    expect(replayViewState(input({ error: refused(404, 'replay_not_ready') }))).toBe('notReady');
  });
});
