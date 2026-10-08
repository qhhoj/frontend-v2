import { describe, expect, it } from 'vitest';
import { contestDetail, contestViewer, participationSummary } from '@/test/fixtures';
import { actionFactsOf, commandOf, contestAction } from './contest-action';
import type { ActionFacts } from './contest-action';

const facts = (overrides: Partial<ActionFacts> = {}): ActionFacts => ({
  isSignedIn: true,
  phase: 'running',
  liveStatus: null,
  isCurrent: false,
  canSpectate: false,
  skipsAccessCode: false,
  registration: 'none',
  requiresAccessCode: false,
  disallowVirtual: false,
  ...overrides,
});

describe('contestAction', () => {
  it.each([
    ['a visitor', { isSignedIn: false }, 'signIn'],
    ['the current contest', { isCurrent: true, liveStatus: 'participating' }, 'leave'],
    ['a running contest', {}, 'join'],
    ['a running contest the viewer is in but left', { liveStatus: 'participating' }, 'rejoin'],
    ['a running contest whose time ran out for the viewer', { liveStatus: 'finished' }, 'finished'],
    [
      'a running contest the viewer registered for',
      { liveStatus: 'registered', registration: 'closed' },
      'join',
    ],
    [
      'a running contest whose registration closed without the viewer',
      { registration: 'closed' },
      'registrationClosed',
    ],
    ['a running contest for an editor or tester', { canSpectate: true }, 'spectate'],
    ['an upcoming contest without registration', { phase: 'upcoming' }, 'opensLater'],
    [
      'an upcoming contest with registration open',
      { phase: 'upcoming', registration: 'open' },
      'register',
    ],
    [
      'an upcoming contest the viewer registered for',
      { phase: 'upcoming', registration: 'open', liveStatus: 'registered' },
      'registered',
    ],
    [
      'an upcoming contest whose registration closed',
      { phase: 'upcoming', registration: 'closed' },
      'registrationClosed',
    ],
    ['an ended contest', { phase: 'ended' }, 'virtual'],
    [
      'an ended contest without virtual runs',
      { phase: 'ended', disallowVirtual: true },
      'virtualDisallowed',
    ],
    [
      'an ended contest during the viewer’s virtual run',
      { phase: 'ended', isCurrent: true },
      'leave',
    ],
  ] as const)('%s → %s', (_case, overrides, kind) =>
    expect(contestAction(facts(overrides)).kind).toBe(kind),
  );

  it('asks for the access code only where the backend checks it', () => {
    const coded = { requiresAccessCode: true };
    expect(contestAction(facts(coded)).needsAccessCode).toBe(true);
    expect(contestAction(facts({ ...coded, phase: 'ended' })).needsAccessCode).toBe(true);
    expect(
      contestAction(facts({ ...coded, phase: 'upcoming', registration: 'open' })).needsAccessCode,
    ).toBe(true);
    // An existing participation re-enters and a registered row joins without it; a finished row continues without it.
    expect(contestAction(facts({ ...coded, liveStatus: 'participating' })).needsAccessCode).toBe(
      false,
    );
    expect(contestAction(facts({ ...coded, liveStatus: 'registered' })).needsAccessCode).toBe(
      false,
    );
    expect(contestAction(facts({ ...coded, liveStatus: 'finished' })).needsAccessCode).toBe(false);
  });

  it('skips the code only for viewers who may edit the contest, as the backend does', () => {
    const coded = { requiresAccessCode: true, canSpectate: true };
    expect(contestAction(facts({ ...coded, skipsAccessCode: true })).needsAccessCode).toBe(false);
    // A tester spectates but still needs the code for a new row, running or upcoming.
    expect(contestAction(facts(coded)).needsAccessCode).toBe(true);
    expect(contestAction(facts({ ...coded, phase: 'upcoming' })).needsAccessCode).toBe(true);
    expect(contestAction(facts({ ...coded, phase: 'ended' })).needsAccessCode).toBe(true);
    expect(
      contestAction(facts({ ...coded, phase: 'ended', skipsAccessCode: true })).needsAccessCode,
    ).toBe(false);
  });

  it('maps only the requests to commands', () => {
    expect(commandOf('rejoin')).toBe('join');
    expect(commandOf('register')).toBe('register');
    expect(commandOf('leave')).toBe('leave');
    expect(commandOf('finished')).toBe('join');
    expect(commandOf('opensLater')).toBeNull();
  });
});

describe('actionFactsOf', () => {
  it('reads the phase from the clock, not from the server phase string', () => {
    const contest = contestDetail({ phase: 'upcoming' });
    const startedAt = Date.parse(contest.startTime) + 1000;
    expect(actionFactsOf(contest, true, startedAt).phase).toBe('running');
    expect(actionFactsOf(contest, true, Date.parse(contest.startTime) - 1000).phase).toBe(
      'upcoming',
    );
  });

  it('takes the live status and the current flag from the server, not from the participation times', () => {
    const contest = contestDetail({
      viewer: contestViewer({
        liveStatus: 'finished',
        isCurrent: false,
        inContest: true,
        liveParticipation: participationSummary({ endTime: '2099-01-01T00:00:00Z' }),
      }),
    });
    expect(actionFactsOf(contest, true, Date.parse('2026-10-08T09:00:00Z'))).toMatchObject({
      liveStatus: 'finished',
      isCurrent: false,
    });
  });

  it('passes a registered row from the server straight through', () => {
    const contest = contestDetail({ viewer: contestViewer({ liveStatus: 'registered' }) });
    expect(actionFactsOf(contest, true, Date.parse(contest.endTime) - 1000).liveStatus).toBe(
      'registered',
    );
  });
});
