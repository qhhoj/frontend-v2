import { describe, expect, it } from 'vitest';
import { emptyContestForm } from '../contest-form';
import type { ContestForm } from '../contest-form';
import { changedContestFields } from '../contest-patch';
import {
  accessSaveOf,
  activeRestrictions,
  chooseParticipantMode,
  participantGapsOf,
  restoreAccess,
  shownModeOf,
} from './participants-mode';
import type { ParticipantMode, Restriction } from './participants-mode';

const ORGANIZATION = { id: 'org-1', slug: 'tin11' };
const CONTESTANT = { id: 'user-1', username: 'bitcoder' };
const ACCESS_KEYS = [
  'isOrganizationPrivate',
  'organizations',
  'isPrivate',
  'privateContestants',
  'accessCode',
];

/** A stored contest: its form as loaded, and whether it has an access code (the code itself is never loaded). */
interface Stored {
  form: ContestForm;
  hasCode: boolean;
}
const stored = (fields: Partial<ContestForm> = {}, hasCode = false): Stored => ({
  form: { ...emptyContestForm(), ...fields },
  hasCode,
});
const STARTS = {
  none: () => stored(),
  organization: () => stored({ isOrganizationPrivate: true, organizations: [ORGANIZATION] }),
  list: () => stored({ isPrivate: true, privateContestants: [CONTESTANT] }),
  code: () => stored({}, true),
  organizationAndCode: () =>
    stored({ isOrganizationPrivate: true, organizations: [ORGANIZATION] }, true),
} satisfies Record<string, () => Stored>;
type Start = keyof typeof STARTS;

/** The teacher opens the contest, picks `mode` and then fills `filled` in; what the page would do with "Lưu". */
function afterPick(start: Start, mode: ParticipantMode | null, filled: Partial<ContestForm> = {}) {
  const { form: seed, hasCode } = STARTS[start]();
  const form = structuredClone(seed);
  if (mode !== null) chooseParticipantMode(form, mode, hasCode);
  Object.assign(form, filled);
  const patch = changedContestFields(seed, form) as Record<string, unknown>;
  return {
    form,
    hasCode,
    sent: Object.fromEntries(Object.entries(patch).filter(([key]) => ACCESS_KEYS.includes(key))),
    save: accessSaveOf(seed, form, mode, hasCode),
  };
}

describe('a pick that is complete', () => {
  it.each<[Start, ParticipantMode, Partial<ContestForm>, Record<string, unknown>, Restriction[]]>([
    [
      'none',
      'organization',
      { organizations: [ORGANIZATION] },
      { isOrganizationPrivate: true, organizations: ['org-1'] },
      [],
    ],
    ['none', 'code', { accessCode: 'abc' }, { accessCode: 'abc' }, []],
    [
      'none',
      'list',
      { privateContestants: [CONTESTANT] },
      { isPrivate: true, privateContestants: ['user-1'] },
      [],
    ],
    ['none', 'open', {}, {}, []],
    ['organization', 'organization', {}, {}, []],
    [
      'organization',
      'code',
      { accessCode: 'abc' },
      { isOrganizationPrivate: false, accessCode: 'abc' },
      ['organization'],
    ],
    [
      'organization',
      'list',
      { privateContestants: [CONTESTANT] },
      { isOrganizationPrivate: false, isPrivate: true, privateContestants: ['user-1'] },
      ['organization'],
    ],
    ['organization', 'open', {}, { isOrganizationPrivate: false }, ['organization']],
    [
      'list',
      'organization',
      { organizations: [ORGANIZATION] },
      { isPrivate: false, isOrganizationPrivate: true, organizations: ['org-1'] },
      ['list'],
    ],
    ['list', 'code', { accessCode: 'abc' }, { isPrivate: false, accessCode: 'abc' }, ['list']],
    ['list', 'list', {}, {}, []],
    ['list', 'open', {}, { isPrivate: false }, ['list']],
    [
      'code',
      'organization',
      { organizations: [ORGANIZATION] },
      { isOrganizationPrivate: true, organizations: ['org-1'], accessCode: '' },
      ['code'],
    ],
    ['code', 'code', {}, {}, []],
    [
      'code',
      'list',
      { privateContestants: [CONTESTANT] },
      { isPrivate: true, privateContestants: ['user-1'], accessCode: '' },
      ['code'],
    ],
    ['code', 'open', {}, { accessCode: '' }, ['code']],
    ['organizationAndCode', 'organization', {}, { accessCode: '' }, ['code']],
    ['organizationAndCode', 'code', {}, { isOrganizationPrivate: false }, ['organization']],
    [
      'organizationAndCode',
      'list',
      { privateContestants: [CONTESTANT] },
      {
        isOrganizationPrivate: false,
        isPrivate: true,
        privateContestants: ['user-1'],
        accessCode: '',
      },
      ['organization', 'code'],
    ],
    [
      'organizationAndCode',
      'open',
      {},
      { isOrganizationPrivate: false, accessCode: '' },
      ['organization', 'code'],
    ],
  ])(
    '%s, then "%s": sends only the switches and asks before a restriction goes',
    (start, mode, filled, sent, removed) => {
      const result = afterPick(start, mode, filled);
      expect(result.sent).toEqual(sent);
      expect(result.save.kind).toBe(removed.length > 0 ? 'confirm' : 'send');
      if (result.save.kind === 'confirm') expect(result.save.removed).toEqual(removed);
    },
  );

  it('says what still restricts after a confirmed save', () => {
    expect(afterPick('organizationAndCode', 'organization').save).toEqual({
      kind: 'confirm',
      removed: ['code'],
      remaining: ['organization'],
    });
    expect(afterPick('organization', 'open').save).toEqual({
      kind: 'confirm',
      removed: ['organization'],
      remaining: [],
    });
  });

  it('keeps the organizations and the list in the form when their restriction is switched off', () => {
    expect(afterPick('organization', 'open').form.organizations).toEqual([ORGANIZATION]);
    expect(afterPick('list', 'code').form.privateContestants).toEqual([CONTESTANT]);
  });
});

describe('a pick that is incomplete', () => {
  const STARTS_LIST = Object.keys(STARTS) as Start[];
  const cases = STARTS_LIST.flatMap((start) =>
    (['organization', 'code', 'list'] as const).map((mode) => [start, mode] as const),
  );

  it.each(cases)('%s, then "%s" with nothing filled in: never saved as open', (start, mode) => {
    const { form, hasCode, save } = afterPick(start, mode);
    const restrictsAfter =
      activeRestrictions(form, hasCode).includes(mode) &&
      participantGapsOf(form, mode, hasCode).length === 0;
    expect(save.kind === 'blocked' || restrictsAfter).toBe(true);
  });

  it.each<[Start, Restriction]>([
    ['none', 'organization'],
    ['none', 'code'],
    ['none', 'list'],
    ['organization', 'code'],
    ['organization', 'list'],
    ['list', 'organization'],
    ['list', 'code'],
    ['code', 'organization'],
    ['code', 'list'],
    ['organizationAndCode', 'list'],
  ])('%s, then "%s": the save is blocked and names what is missing', (start, mode) => {
    expect(afterPick(start, mode).save).toEqual({ kind: 'blocked', gaps: [mode] });
  });

  it('keeps a stored code picked again after "open", and blocks "code" once that code is marked for removal', () => {
    const { form: seed, hasCode } = STARTS.code();
    const form = structuredClone(seed);
    chooseParticipantMode(form, 'open', hasCode);
    chooseParticipantMode(form, 'code', hasCode);
    expect(accessSaveOf(seed, form, 'code', hasCode)).toEqual({ kind: 'send' });
    form.removeAccessCode = true;
    expect(accessSaveOf(seed, form, 'code', hasCode)).toEqual({ kind: 'blocked', gaps: ['code'] });
  });

  it('blocks a list or an organization restriction the teacher emptied', () => {
    expect(afterPick('list', null, { privateContestants: [] }).save).toEqual({
      kind: 'blocked',
      gaps: ['list'],
    });
    expect(afterPick('organization', null, { organizations: [] }).save).toEqual({
      kind: 'blocked',
      gaps: ['organization'],
    });
  });
});

describe('a contest the teacher did not change', () => {
  it.each(Object.keys(STARTS) as Start[])('%s: sends nothing and asks nothing', (start) => {
    const result = afterPick(start, null);
    expect(result.sent).toEqual({});
    expect(result.save).toEqual({ kind: 'send' });
  });

  it('shows two stored restrictions as two, and one or none as the mode', () => {
    const modeOf = (start: Start) => {
      const { form, hasCode } = STARTS[start]();
      return shownModeOf(form, null, hasCode);
    };
    expect(modeOf('organizationAndCode')).toBeNull();
    expect(modeOf('organization')).toBe('organization');
    expect(modeOf('code')).toBe('code');
    expect(modeOf('none')).toBe('open');
    const both = STARTS.organizationAndCode();
    expect(activeRestrictions(both.form, both.hasCode)).toEqual(['organization', 'code']);
  });

  it('does not block another edit of a contest stored with an empty list', () => {
    const seed = stored({ isPrivate: true }).form;
    const form = { ...structuredClone(seed), name: 'Renamed' };
    expect(participantGapsOf(form, null, false)).toEqual(['list']);
    expect(accessSaveOf(seed, form, null, false)).toEqual({ kind: 'send' });
  });

  it('is back to the stored contest after an undone pick', () => {
    const { form: seed, hasCode } = STARTS.organizationAndCode();
    const form = structuredClone(seed);
    chooseParticipantMode(form, 'open', hasCode);
    restoreAccess(form, seed);
    expect(changedContestFields(seed, form)).toEqual({});
    expect(accessSaveOf(seed, form, null, hasCode)).toEqual({ kind: 'send' });
  });
});
