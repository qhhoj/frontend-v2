import { describe, expect, it } from 'vitest';
import { contestSettings, CURATOR_ID, editableContest } from '@/test/admin-fixtures/contests';
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

  it('names the user chips from the usernames the settings carry', () => {
    expect(seeded().curators).toEqual([{ id: CURATOR_ID, username: 'admin_vnoj' }]);
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

  it('sends pushAnnouncements as the boolean it was switched to', () => {
    const before = seeded();
    expect(before.pushAnnouncements).toBe(false);
    expect(
      changedContestFields(before, { ...structuredClone(before), pushAnnouncements: true }),
    ).toEqual({ pushAnnouncements: true });
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

  it('sends organizations as ids', () => {
    const before = seeded();
    const after = {
      ...structuredClone(before),
      organizations: [{ id: 'org-a', slug: 'thpt-hung-vuong' }],
    };
    expect(changedContestFields(before, after)).toEqual({ organizations: ['org-a'] });
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

  it('refuses more than 20 tags and a negative frozen time', () => {
    const form = {
      ...seeded(),
      tags: Array.from({ length: 21 }, (_entry, index) => `t${index}`),
      frozenLastMinutes: -1,
    };
    expect(Object.keys(checkContestForm(form)).sort()).toEqual(['frozenLastMinutes', 'tags']);
  });

  it('builds a create body with the key and without unset optional fields', () => {
    const body = toContestBody(newContest(), () => true);
    expect(body).toMatchObject({ key: 'w42', name: 'W42', formatName: 'default' });
    expect(body).not.toHaveProperty('accessCode');
    expect(body).not.toHaveProperty('timeLimit');
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
