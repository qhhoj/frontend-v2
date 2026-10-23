import { describe, expect, it } from 'vitest';
import { contestSettings, editableContest } from '@/test/admin-fixtures/contests';
import {
  canSetVisible,
  changedContestFields,
  checkContestForm,
  checkContestIdentity,
  emptyContestForm,
  GATED_CONTEST_FIELDS,
  toContestBody,
  toContestForm,
} from './contest-form';

const seeded = () => toContestForm(editableContest());
/** A contest whose nullable fields hold values, so clearing them is a real change. */
const withNullablesSet = () =>
  toContestForm(
    editableContest({
      timeLimit: 3600,
      registrationStart: '2026-10-07T06:00:00.000Z',
      settings: contestSettings({ ratingFloor: 1200 }),
    }),
  );
const newContest = () => ({
  ...emptyContestForm(),
  key: 'w42',
  name: 'W42',
  startTime: '2026-10-15T06:00:00.000Z',
  endTime: '2026-10-15T10:00:00.000Z',
});

describe('contest form', () => {
  it('sends nothing for an untouched form, the push switch and the codes included', () => {
    const before = seeded();
    expect(changedContestFields(before, structuredClone(before))).toEqual({});
  });

  it('spells every stored time one way, so retyping the same instant is no change', () => {
    const form = toContestForm(editableContest({ startTime: '2026-10-08T06:00:00Z' }));
    expect(form.startTime).toBe('2026-10-08T06:00:00.000Z');
    expect(
      changedContestFields(form, {
        ...structuredClone(form),
        startTime: new Date(form.startTime).toISOString(),
      }),
    ).toEqual({});
  });

  it('sends the create times as the instants typed', () => {
    expect(toContestBody(newContest(), () => true)).toMatchObject({
      startTime: '2026-10-15T06:00:00.000Z',
      endTime: '2026-10-15T10:00:00.000Z',
    });
  });

  it('sends null when a nullable field is cleared', () => {
    const before = withNullablesSet();
    expect(before).toMatchObject({ timeLimit: 3600, ratingFloor: 1200 });
    expect(before.registrationStart).not.toBe('');
    const after = {
      ...structuredClone(before),
      timeLimit: null,
      registrationStart: '',
      ratingFloor: null,
    };
    expect(changedContestFields(before, after)).toEqual({
      timeLimit: null,
      registrationStart: null,
      ratingFloor: null,
    });
  });

  it('never sends null for a field that refuses it', () => {
    const before = seeded();
    const after = { ...structuredClone(before), startTime: '', scoreboardCacheTimeout: Number.NaN };
    const patch = changedContestFields(before, after);
    expect(Object.values(patch)).not.toContain(null);
    expect(checkContestForm(after)).toMatchObject({
      startTime: expect.any(String),
      scoreboardCacheTimeout: expect.any(String),
    });
  });

  it('keeps a stored access code unless a new one is typed or removal is asked for', () => {
    const before = seeded();
    expect(
      changedContestFields(before, { ...structuredClone(before), accessCode: 'secret' }),
    ).toEqual({ accessCode: 'secret' });
    expect(
      changedContestFields(before, { ...structuredClone(before), removeAccessCode: true }),
    ).toEqual({ accessCode: '' });
    expect(
      changedContestFields(before, { ...structuredClone(before), removeRankingAccessCode: true }),
    ).toEqual({ rankingAccessCode: '' });
  });

  it('sends user lists as ids and resends the format config with a new format', () => {
    const before = seeded();
    const after = structuredClone(before);
    after.curators = [{ id: 'id-admin', username: 'admin_vnoj' }];
    after.formatName = 'vnoj';
    after.formatConfig = { penalty: 5, lso: false };
    expect(changedContestFields(before, after)).toEqual({
      curators: ['id-admin'],
      formatName: 'vnoj',
      formatConfig: { penalty: 5, lso: false },
    });
  });

  it('refuses an end before the start and a rating floor above the ceiling', () => {
    const form = {
      ...seeded(),
      endTime: '2026-10-08T05:00:00.000Z',
      startTime: '2026-10-08T06:00:00.000Z',
      ratingFloor: 2000,
      ratingCeiling: 1000,
    };
    expect(Object.keys(checkContestForm(form)).sort()).toEqual(['endTime', 'ratingCeiling']);
  });

  it('leaves the rating, lock, private, access code and visibility groups out of a create by an account without their permissions', () => {
    const filled = {
      ...newContest(),
      isRated: true,
      rateAll: true,
      ratingFloor: 1000,
      isPrivate: true,
      accessCode: 'secret',
      isVisible: true,
      lockedAfter: '2026-10-15T11:00:00.000Z',
      isOrganizationPrivate: true,
    };
    const body = toContestBody(filled, () => false);
    for (const field of Object.values(GATED_CONTEST_FIELDS).flat())
      expect(body, field).not.toHaveProperty(field);
    expect(body).toMatchObject({ key: 'w42', name: 'W42' });
  });

  it('sends a gated group only for an account holding its permission, and an untouched create form carries no rateAll', () => {
    const rated = { ...newContest(), isRated: true, ratingFloor: 1000 };
    expect(
      toContestBody(rated, (permission) => permission === 'judge.contest_rating'),
    ).toMatchObject({ isRated: true, ratingFloor: 1000 });
    expect(
      toContestBody(rated, (permission) => permission === 'judge.lock_contest'),
    ).not.toHaveProperty('isRated');
    expect(emptyContestForm().rateAll).toBe(false);
  });

  it('refuses a cleared points precision and a cleared penalty, so neither reaches the server as null', () => {
    const cleared = {
      ...seeded(),
      pointsPrecision: Number.NaN,
      formatConfig: { penalty: Number.NaN },
    };
    expect(Object.keys(checkContestForm(cleared)).sort()).toEqual([
      'formatConfig.penalty',
      'pointsPrecision',
    ]);
    const emptyBox = { ...seeded(), pointsPrecision: '' as unknown as number };
    expect(Object.keys(checkContestForm(emptyBox))).toEqual(['pointsPrecision']);
  });
});

describe('contest form operations fields', () => {
  const VOLUNTEER = '0192a000-0000-7000-8000-00000000b001';
  const OTHER = '0192a000-0000-7000-8000-00000000b002';
  const settings = contestSettings({ balloons: true, balloonStaff: [VOLUNTEER] });

  it('sends changed rules and volunteers as ids, and nothing for untouched ones', () => {
    const before = toContestForm(editableContest({ settings }));
    const after = {
      ...before,
      rules: 'Tự làm bài.',
      balloonStaff: [...before.balloonStaff, { id: OTHER, username: 'tnv2' }],
    };
    expect(changedContestFields(before, after)).toEqual({
      rules: 'Tự làm bài.',
      balloonStaff: [VOLUNTEER, OTHER],
    });
    expect(changedContestFields(before, { ...before })).toEqual({});
  });

  it('sends cleared rules as an empty string (no rules), never null', () => {
    const before = toContestForm(editableContest({ rules: 'Cũ', settings }));
    expect(changedContestFields(before, { ...before, rules: '' })).toEqual({ rules: '' });
  });

  it('refuses rules longer than the backend allows', () => {
    const form = { ...newContest(), rules: 'x'.repeat(8193) };
    expect(checkContestForm(form)).toHaveProperty('rules');
    expect(checkContestForm({ ...form, rules: 'x'.repeat(8192) })).not.toHaveProperty('rules');
  });

  describe('who may set isVisible', () => {
    const PRIVATE = 'judge.create_private_contest';
    const only = (permission: string) => (asked: string) => asked === permission;
    const form = (flags: { isPrivate?: boolean; isOrganizationPrivate?: boolean }) => ({
      isPrivate: false,
      isOrganizationPrivate: false,
      ...flags,
    });

    it('lets an org admin show a private or organization-private contest, never a public one', () => {
      expect(canSetVisible(form({ isOrganizationPrivate: true }), only(PRIVATE))).toBe(true);
      expect(canSetVisible(form({ isPrivate: true }), only(PRIVATE))).toBe(true);
      expect(canSetVisible(form({}), only(PRIVATE))).toBe(false);
      expect(canSetVisible(form({}), only(PRIVATE), true)).toBe(true);
    });

    it('leaves staff holding change_contest_visibility free on any contest, and others locked', () => {
      expect(canSetVisible(form({}), only('judge.change_contest_visibility'))).toBe(true);
      expect(canSetVisible(form({ isPrivate: true }), () => false)).toBe(false);
    });

    it('sends isVisible on create exactly when canSetVisible allows it', () => {
      const shown = { ...newContest(), isVisible: true };
      expect(toContestBody(shown, only(PRIVATE), true)).toHaveProperty('isVisible', true);
      expect(toContestBody(shown, only(PRIVATE))).not.toHaveProperty('isVisible');
      expect(toContestBody(shown, only('judge.change_contest_visibility'))).toHaveProperty(
        'isVisible',
        true,
      );
    });
  });
});

describe('checkContestIdentity', () => {
  it('accepts a key of lowercase letters, digits and underscores, 1 to 32, and a name of 1 to 100', () => {
    expect(checkContestIdentity({ key: 'contest_01', name: 'Kỳ thi' })).toEqual({});
    expect(checkContestIdentity({ key: 'a'.repeat(32), name: 'n'.repeat(100) })).toEqual({});
  });
  it('names the key rule for a key outside it', () => {
    for (const key of ['Bad Key!', '', 'UPPER', 'a-b', 'a'.repeat(33)])
      expect(checkContestIdentity({ key, name: 'ok' }).key, key).toBe(
        'Khóa chỉ gồm chữ thường, số và dấu gạch dưới, 1 đến 32 ký tự.',
      );
  });
  it('states the name limit for an empty or 101-character name', () => {
    for (const name of ['', '  ', 'n'.repeat(101)])
      expect(checkContestIdentity({ key: 'ok', name }).name).toBe('Tên kỳ thi từ 1 đến 100 ký tự.');
  });
});
