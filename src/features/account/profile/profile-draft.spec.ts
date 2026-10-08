import { describe, expect, it } from 'vitest';
import { profile, profileOrganization } from '@/test/fixtures';
import {
  changedFields,
  draftOf,
  lengthProblems,
  settleAfterSave,
  withOrganizationsOf,
  rebaseOrganizationIds,
} from './profile-draft';
import type { ProfileDraft } from './profile-draft';

const LHP = profileOrganization();
const HCM = profileOrganization({
  id: '0192a000-0000-7000-8000-0000000001a2',
  name: 'Đội tuyển Tin học TP.HCM',
});
const base: ProfileDraft = draftOf(profile({ firstName: 'Thư', organizations: [LHP, HCM] }));

describe('draftOf', () => {
  it('keeps the organizations as ids in the viewer’s order', () => {
    expect(base.organizationIds).toEqual([LHP.id, HCM.id]);
  });
});

describe('changedFields', () => {
  it('is empty when nothing changed', () => {
    expect(changedFields({ ...base }, base)).toEqual({});
  });

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
  it('allows exactly the backend limits', () => {
    expect(
      lengthProblems({ ...base, firstName: 'x'.repeat(30), about: 'y'.repeat(65_536) }),
    ).toEqual([]);
  });

  it('reports each text over its limit with the count used', () => {
    expect(
      lengthProblems({ ...base, firstName: 'x'.repeat(31), about: 'y'.repeat(65_537) }),
    ).toEqual([
      { field: 'firstName', used: 31, max: 30 },
      { field: 'about', used: 65_537, max: 65_536 },
    ]);
  });

  it('counts like the backend: an emoji is two units', () => {
    expect(lengthProblems({ ...base, firstName: '🙂'.repeat(16) })).toEqual([
      { field: 'firstName', used: 32, max: 30 },
    ]);
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

describe('withOrganizationsOf', () => {
  it('replaces only the organizations with the server’s list', () => {
    const draft = { ...base, firstName: 'Minh Thư', organizationIds: [HCM.id, LHP.id] };
    expect(withOrganizationsOf(draft, profile({ organizations: [HCM] }))).toEqual({
      ...draft,
      organizationIds: [HCM.id],
    });
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

  it('reports the count of the composed form for a decomposed over-long name', () => {
    expect(lengthProblems({ ...base, firstName: 'ệ'.normalize('NFD').repeat(31) })).toEqual([
      { field: 'firstName', used: 31, max: 30 },
    ]);
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
    ['the viewer removed one and the server agrees: it stays gone', [ORG_A], [ORG_A], [ORG_A]],
    [
      'the viewer reordered: the viewer order is kept',
      [ORG_B, ORG_A],
      [ORG_A, ORG_B],
      [ORG_B, ORG_A],
    ],
    [
      'an admin-leave refusal: the still-listed organization comes back',
      [ORG_B],
      [ORG_A, ORG_B],
      [ORG_B, ORG_A],
    ],
  ])('%s', (_case, draftIds, serverIds, expected) => {
    expect(rebaseOrganizationIds(draftIds, serverIds)).toEqual(expected);
  });
});
