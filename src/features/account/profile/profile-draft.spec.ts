import { describe, expect, it } from 'vitest';
import { profile, profileOrganization } from '@/test/fixtures';
import {
  changedFields,
  draftOf,
  lengthProblems,
  settleAfterSave,
  rebaseOrganizationIds,
  storedLength,
} from './profile-draft';
import type { ProfileDraft } from './profile-draft';

const LHP = profileOrganization();
const HCM = profileOrganization({
  id: '0192a000-0000-7000-8000-0000000001a2',
  name: 'Đội tuyển Tin học TP.HCM',
});
const base: ProfileDraft = draftOf(profile({ firstName: 'Thư', organizations: [LHP, HCM] }));

describe('changedFields', () => {
  it.each([
    [{ firstName: 'Minh Thư' }, { firstName: 'Minh Thư' }],
    [{ about: '## Mục tiêu' }, { about: '## Mục tiêu' }],
    [{ timezone: 'Asia/Tokyo' }, { timezone: 'Asia/Tokyo' }],
    [{ languageId: 'lang-2' }, { languageId: 'lang-2' }],
    [{ organizationIds: [HCM.id, LHP.id] }, { organizations: [HCM.id, LHP.id] }],
    [{ organizationIds: [HCM.id] }, { organizations: [HCM.id] }],
  ])('sends only %j', (change, patch) => {
    expect(changedFields({ ...base, ...change }, base)).toEqual(patch);
  });

  it('never sends a cleared language: the backend cannot store none', () => {
    expect(changedFields({ ...base, languageId: null }, base)).toEqual({});
  });
});

describe('lengthProblems', () => {
  it('reports each text over its limit with the count used', () => {
    expect(
      lengthProblems({ ...base, firstName: 'x'.repeat(31), about: 'y'.repeat(65_537) }),
    ).toEqual([
      { field: 'firstName', used: 31, max: 30 },
      { field: 'about', used: 65_537, max: 65_536 },
    ]);
  });

  it('accepts a string exactly at the limit and refuses the same string plus one emoji', () => {
    const atLimit = 'x'.repeat(29) + '🙂';
    expect(storedLength(atLimit)).toBe(30);
    expect(lengthProblems({ ...base, firstName: atLimit })).toEqual([]);
    expect(lengthProblems({ ...base, firstName: atLimit + '🙂' })).toEqual([
      { field: 'firstName', used: 31, max: 30 },
    ]);
  });

  it('counts an emoji with a variation selector as one', () => {
    expect(storedLength('🙂\uFE0F')).toBe(1);
    expect(storedLength('❤\uFE0F')).toBe(1);
  });
});

describe('settleAfterSave', () => {
  it('takes the stored value of a field untouched since sending (the backend trims the name)', () => {
    const sent = { ...base, firstName: 'Thư  ' };
    expect(settleAfterSave(sent, sent, { ...base, firstName: 'Thư' }).firstName).toBe('Thư');
  });

  it('keeps what the viewer typed while the save was in flight', () => {
    const sent = { ...base, about: 'A' };
    const current = { ...base, about: 'AB' };
    expect(settleAfterSave(current, sent, { ...base, about: 'A' }).about).toBe('AB');
  });
});

describe('Vietnamese text is counted and sent as NFC', () => {
  const decomposedViet = 'Việt'.normalize('NFD');

  it('counts a decomposed name as the composed one, so the same text is not over the limit', () => {
    expect(decomposedViet.length).toBeGreaterThan('Việt'.length);
    const composedTo30 = 'ệ'.repeat(30);
    expect(lengthProblems({ ...base, firstName: 'ệ'.normalize('NFD').repeat(30) })).toEqual([]);
    expect(lengthProblems({ ...base, firstName: composedTo30 })).toEqual([]);
  });

  it('sends the composed form, and sends nothing when only the normalisation differs', () => {
    expect(
      changedFields({ ...base, firstName: decomposedViet }, { ...base, firstName: 'Việt' }),
    ).toEqual({});
    expect(
      changedFields({ ...base, firstName: decomposedViet + '!' }, { ...base, firstName: 'Việt' }),
    ).toEqual({
      firstName: 'Việt!',
    });
  });
});

describe('rebaseOrganizationIds', () => {
  const [ORG_A, ORG_B, ORG_C] = ['org-a', 'org-b', 'org-c'];
  it.each([
    [
      'another device added one: it is appended in server order',
      [ORG_A, ORG_B],
      [ORG_A, ORG_B, ORG_C],
      [ORG_A, ORG_B, ORG_C],
    ],
    ['the server dropped one: it is gone', [ORG_A, ORG_B], [ORG_A], [ORG_A]],
    ["the server agrees with the viewer's removal: it stays gone", [ORG_A], [ORG_A], [ORG_A]],
    [
      'the viewer reordered: the viewer order is kept',
      [ORG_B, ORG_A],
      [ORG_A, ORG_B],
      [ORG_B, ORG_A],
    ],
    [
      'the viewer removed one the server still lists (a refused removal, for instance an admin-leave): it comes back',
      [ORG_B],
      [ORG_A, ORG_B],
      [ORG_B, ORG_A],
    ],
  ])('%s', (_case, draftIds, serverIds, expected) => {
    expect(rebaseOrganizationIds(draftIds, serverIds)).toEqual(expected);
  });
});
