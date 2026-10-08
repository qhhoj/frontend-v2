import type { ContestDetail, ContestPhase } from '@/api/types/contests';
import { liveStatusOf, phaseAt, registrationState } from '@/lib/contest-time';
import type { LiveStatus } from '@/lib/contest-time';

export type ContestActionKind =
  | 'signIn'
  | 'join'
  | 'rejoin'
  | 'register'
  | 'registered'
  | 'spectate'
  | 'virtual'
  | 'leave'
  | 'finished'
  | 'opensLater'
  | 'registrationClosed'
  | 'virtualDisallowed';
export interface ActionFacts {
  isSignedIn: boolean;
  phase: ContestPhase;
  liveStatus: LiveStatus | null;
  isCurrent: boolean;
  /** Editors and testers spectate instead of competing, and never need the access code. */
  canSpectate: boolean;
  registration: 'none' | 'open' | 'closed';
  requiresAccessCode: boolean;
  disallowVirtual: boolean;
}
export interface ContestAction {
  kind: ContestActionKind;
  needsAccessCode: boolean;
}
export type ParticipationCommand = 'join' | 'register' | 'leave';

const action = (kind: ContestActionKind, needsAccessCode = false): ContestAction => ({
  kind,
  needsAccessCode,
});

function upcomingAction(facts: ActionFacts): ContestAction {
  if (facts.canSpectate) return action('spectate');
  if (facts.liveStatus === 'registered') return action('registered');
  if (facts.registration === 'open') return action('register', facts.requiresAccessCode);
  return action(facts.registration === 'closed' ? 'registrationClosed' : 'opensLater');
}

/** Backend `join`: an existing row re-enters (no code), a registered row joins (no code), a new one needs the window and the code. */
function runningAction(facts: ActionFacts): ContestAction {
  if (facts.canSpectate) return action('spectate');
  if (facts.liveStatus === 'participating') return action('rejoin');
  if (facts.liveStatus === 'finished') return action('finished');
  if (facts.liveStatus === 'registered') return action('join');
  if (facts.registration === 'closed') return action('registrationClosed');
  return action('join', facts.requiresAccessCode);
}

function endedAction(facts: ActionFacts): ContestAction {
  if (facts.disallowVirtual) return action('virtualDisallowed');
  return action('virtual', facts.requiresAccessCode && !facts.canSpectate);
}

export function contestAction(facts: ActionFacts): ContestAction {
  if (!facts.isSignedIn) return action('signIn');
  if (facts.isCurrent) return action('leave');
  if (facts.phase === 'upcoming') return upcomingAction(facts);
  return facts.phase === 'running' ? runningAction(facts) : endedAction(facts);
}

/** The detail as action facts; the phase follows the clock so the actions switch with the countdown. */
export function actionFactsOf(
  contest: ContestDetail,
  isSignedIn: boolean,
  now: number,
): ActionFacts {
  const { viewer } = contest;
  return {
    isSignedIn,
    phase: phaseAt(contest, now),
    liveStatus: liveStatusOf(contest, viewer.liveParticipation, now),
    isCurrent: viewer.inContest,
    canSpectate: viewer.isEditor || viewer.isTester,
    registration: registrationState(contest, now),
    requiresAccessCode: contest.requiresAccessCode,
    disallowVirtual: contest.disallowVirtual,
  };
}

const COMMANDS: Partial<Record<ContestActionKind, ParticipationCommand>> = {
  join: 'join',
  rejoin: 'join',
  spectate: 'join',
  virtual: 'join',
  register: 'register',
  leave: 'leave',
};
/** The request behind an action; null for the actions that are only a message. */
export const commandOf = (kind: ContestActionKind): ParticipationCommand | null =>
  COMMANDS[kind] ?? null;
