import { describe, expect, it } from 'vitest';
import {
  contestDetail,
  contestItem,
  contestViewer,
  listViewer,
  participationSummary,
} from '@/test/fixtures';
import { actionFactsOf, contestAction, listCallToAction, signInLabelKey } from './contest-action';
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
    [
      'an ended contest for an editor or tester',
      { phase: 'ended', canSpectate: true },
      'endedForStaff',
    ],
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
});

describe('listCallToAction', () => {
  const NOW = Date.parse('2026-10-08T09:00:00Z');
  const signedIn = listViewer();
  const current = listViewer({ isCurrent: true, liveStatus: 'participating' });
  const registrationOpen = { registrationEnd: '2026-10-08T10:00:00Z' };
  const registrationClosed = { registrationEnd: '2026-10-08T08:30:00Z' };
  const upcoming = {
    phase: 'upcoming' as const,
    startTime: '2026-10-08T10:00:00Z',
    endTime: '2026-10-08T12:00:00Z',
  };
  const ended = {
    phase: 'ended' as const,
    startTime: '2026-10-08T05:00:00Z',
    endTime: '2026-10-08T07:00:00Z',
  };
  it.each([
    ['a visitor on a running contest', contestItem(), 'contests.list.enter', null, false],
    [
      'a running contest the viewer registered for',
      contestItem({ viewer: listViewer({ liveStatus: 'registered' }) }),
      'contests.list.enter',
      null,
      false,
    ],
    [
      'a running contest the viewer took part in but is not current',
      contestItem({ viewer: listViewer({ liveStatus: 'participating' }) }),
      'contests.actions.rejoin',
      null,
      false,
    ],
    [
      'a visitor on a running contest whose registration closed',
      contestItem(registrationClosed),
      'contests.list.view',
      null,
      false,
    ],
    [
      'a visitor on an upcoming contest with registration open',
      contestItem({ ...upcoming, ...registrationOpen }),
      'contests.list.viewAndRegister',
      null,
      false,
    ],
    [
      'a visitor on an upcoming contest without registration',
      contestItem(upcoming),
      'contests.list.view',
      null,
      false,
    ],
    ['a visitor on an ended contest', contestItem(ended), 'contests.list.view', null, false],
    [
      'a visitor on an ended contest without virtual runs',
      contestItem({ ...ended, disallowVirtual: true }),
      'contests.list.view',
      null,
      false,
    ],
    [
      'the viewer’s current contest',
      contestItem({ viewer: current }),
      'contests.actions.rejoin',
      'contests.list.badges.inContest',
      true,
    ],
    [
      'a finished run',
      contestItem({ viewer: listViewer({ liveStatus: 'finished' }) }),
      'contests.list.view',
      'contests.list.badges.finished',
      false,
    ],
    [
      'an upcoming contest the viewer registered for',
      contestItem({
        ...upcoming,
        ...registrationOpen,
        viewer: listViewer({ liveStatus: 'registered' }),
      }),
      'contests.list.view',
      'contests.list.badges.registered',
      false,
    ],
    [
      'an upcoming contest with registration open',
      contestItem({ ...upcoming, ...registrationOpen, viewer: signedIn }),
      'contests.list.viewAndRegister',
      null,
      false,
    ],
    [
      'an ended contest',
      contestItem({ ...ended, viewer: signedIn }),
      'contests.list.view',
      null,
      false,
    ],
    [
      'a running row whose end has passed reads as ended',
      contestItem({ endTime: '2026-10-08T08:30:00Z' }),
      'contests.list.view',
      null,
      false,
    ],
  ] as const)('%s', (_case, item, labelKey, badgeKey, isPrimary) =>
    expect(listCallToAction(item, NOW)).toEqual({ labelKey, badgeKey, isPrimary }),
  );
});

describe('signInLabelKey', () => {
  it.each([
    ['upcoming', 'upcoming', false, 'contests.actions.signIn'],
    ['running', 'running', false, 'contests.actions.signIn'],
    ['ended', 'ended', false, 'contests.actions.signInVirtual'],
    ['ended without virtual runs', 'ended', true, 'contests.actions.signInOnly'],
  ] as const)('a visitor on a %s contest', (_name, phase, disallowVirtual, key) => {
    expect(signInLabelKey({ phase, disallowVirtual })).toBe(key);
  });
});
