import { describe, expect, it } from 'vitest';
import { contestSettings, editableContest } from '@/test/admin-fixtures/contests';
import {
  changedContestFields,
  checkContestForm,
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
  startTime: '2026-10-15T13:00',
  endTime: '2026-10-15T17:00',
});

describe('contest form', () => {
  it('sends nothing for an untouched form, the push switch and the codes included', () => {
    const before = seeded();
    expect(changedContestFields(before, structuredClone(before))).toEqual({});
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
      endTime: '2026-10-08T12:00',
      startTime: '2026-10-08T13:00',
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
      lockedAfter: '2026-10-15T18:00',
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
});
