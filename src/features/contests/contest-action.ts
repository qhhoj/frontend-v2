import type {
  ContestDetail,
  ContestListItem,
  ContestPhase,
  LiveStatus,
} from '@/api/types/contests';
import { phaseAt, registrationState } from '@/lib/contest-time';

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
  /** Editors and testers spectate instead of competing. */
  canSpectate: boolean;
  /** Backend `canEdit`: the only viewers the access code is skipped for. */
  skipsAccessCode: boolean;
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

/** A new participation row needs the code unless the viewer may edit the contest (backend `assertAccessCode`). */
const newRowNeedsCode = (facts: ActionFacts): boolean =>
  facts.liveStatus === null && facts.requiresAccessCode && !facts.skipsAccessCode;

function upcomingAction(facts: ActionFacts): ContestAction {
  if (facts.canSpectate) return action('spectate', newRowNeedsCode(facts));
  if (facts.liveStatus === 'registered') return action('registered');
  if (facts.registration === 'open') return action('register', facts.requiresAccessCode);
  return action(facts.registration === 'closed' ? 'registrationClosed' : 'opensLater');
}

/** Backend `join`: an existing row re-enters (no code), a registered row joins (no code), a new one needs the window and the code. */
function runningAction(facts: ActionFacts): ContestAction {
  if (facts.canSpectate) return action('spectate', newRowNeedsCode(facts));
  if (facts.liveStatus === 'participating') return action('rejoin');
  /** Backend `reenter`: a finished row continues as a spectator row, with no code. */
  if (facts.liveStatus === 'finished') return action('finished');
  if (facts.liveStatus === 'registered') return action('join');
  if (facts.registration === 'closed') return action('registrationClosed');
  return action('join', facts.requiresAccessCode);
}

function endedAction(facts: ActionFacts): ContestAction {
  if (facts.canSpectate) return action('spectate', newRowNeedsCode(facts));
  if (facts.disallowVirtual) return action('virtualDisallowed');
  return action('virtual', facts.requiresAccessCode && !facts.skipsAccessCode);
}

/** The visitor's button: the contest list calls an ended contest's action "Thi ảo", so the sign-in names it too. */
export function signInLabelKey(facts: Pick<ActionFacts, 'phase' | 'disallowVirtual'>): string {
  if (facts.phase !== 'ended') return 'contests.actions.signIn';
  return facts.disallowVirtual ? 'contests.actions.signInOnly' : 'contests.actions.signInVirtual';
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
    liveStatus: viewer.liveStatus,
    isCurrent: viewer.isCurrent,
    canSpectate: viewer.isEditor || viewer.isTester,
    skipsAccessCode: viewer.canEdit,
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
  finished: 'join',
  register: 'register',
  leave: 'leave',
};
/** The request behind an action; null for the actions that are only a message. */
export const commandOf = (kind: ContestActionKind): ParticipationCommand | null =>
  COMMANDS[kind] ?? null;

export interface ListCallToAction {
  labelKey: string;
  isPrimary: boolean;
  /** A status pill before the contest name, or null. */
  badgeKey: string | null;
}

const LIST_LABELS: Record<ContestActionKind, string> = {
  signIn: 'contests.list.enter',
  join: 'contests.list.enter',
  rejoin: 'contests.actions.rejoin',
  leave: 'contests.actions.rejoin',
  register: 'contests.list.viewAndRegister',
  registered: 'contests.list.view',
  spectate: 'contests.list.view',
  virtual: 'contests.list.virtual',
  finished: 'contests.list.view',
  opensLater: 'contests.list.view',
  registrationClosed: 'contests.list.view',
  virtualDisallowed: 'contests.list.view',
};
const LIST_BADGES: Partial<Record<ContestActionKind, string>> = {
  leave: 'contests.list.badges.inContest',
  registered: 'contests.list.badges.registered',
  finished: 'contests.list.badges.finished',
};
/** Only the actions that take the viewer into the contest (or back into it) are primary on a row. */
const PRIMARY_KINDS: readonly ContestActionKind[] = ['join', 'rejoin', 'leave'];

/**
 * A list row's button: the detail's action for the same facts, as a link to the detail (a row never joins by itself).
 * A visitor gets the signed-in label: the detail asks them to sign in where the action needs it.
 * `canSpectate` is false because the list does not carry the editor or tester role.
 */
export function listCallToAction(item: ContestListItem, now: number): ListCallToAction {
  const { kind } = contestAction({
    isSignedIn: true,
    phase: phaseAt(item, now),
    liveStatus: item.viewer?.liveStatus ?? null,
    isCurrent: item.viewer?.isCurrent ?? false,
    canSpectate: false,
    skipsAccessCode: false,
    registration: registrationState(item, now),
    requiresAccessCode: item.requiresAccessCode,
    disallowVirtual: item.disallowVirtual,
  });
  return {
    labelKey: LIST_LABELS[kind],
    isPrimary: PRIMARY_KINDS.includes(kind),
    badgeKey: LIST_BADGES[kind] ?? null,
  };
}
