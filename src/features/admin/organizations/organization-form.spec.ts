import { describe, expect, it } from 'vitest';
import { ADMIN_USER, organizationDetail } from '@/test/community-fixtures';
import {
  changedOrganizationFields,
  checkOrganizationForm,
  emptyOrganizationForm,
  toOrganizationBody,
  toOrganizationForm,
} from './organization-form';

const detail = () => organizationDetail({ slots: 200, about: 'Trường THPT chuyên…' });

describe('organization form', () => {
  it('sends only changed fields, admins as ids and a cleared slot count as null', () => {
    const before = toOrganizationForm(detail());
    const after = {
      ...structuredClone(before),
      slots: null,
      admins: [...before.admins, { id: 'id-new', username: 'colan' }],
    };
    expect(changedOrganizationFields(before, after, true)).toEqual({
      slots: null,
      adminIds: [ADMIN_USER.id, 'id-new'],
    });
  });

  it('never sends staff fields on an edit without judge.edit_all_organization', () => {
    const before = toOrganizationForm(detail());
    const after = {
      ...structuredClone(before),
      isUnlisted: true,
      shortName: 'X',
      name: 'Mới',
    };
    expect(changedOrganizationFields(before, after, false)).toEqual({ name: 'Mới' });
  });

  it('starts a create form from the backend defaults, closed and unlisted', () => {
    expect(emptyOrganizationForm()).toMatchObject({
      isOpen: false,
      isUnlisted: true,
      shortName: '',
      slots: null,
    });
  });

  it('builds a create body for a plain creator without isUnlisted, slots or shortName, even when they are filled', () => {
    const form = {
      ...emptyOrganizationForm(),
      name: 'Mới',
      slug: 'moi',
      shortName: 'MOI',
      slots: 50,
      isUnlisted: false,
      isOpen: true,
    };
    expect(toOrganizationBody(form, false)).toEqual({ name: 'Mới', slug: 'moi', isOpen: true });
  });

  it('builds a create body for staff that carries the staff fields they set, and none they left empty', () => {
    const form = { ...emptyOrganizationForm(), name: 'Mới', slug: 'moi', isUnlisted: false };
    const body = toOrganizationBody(form, true);
    expect(body).toMatchObject({ name: 'Mới', slug: 'moi', isOpen: false, isUnlisted: false });
    expect(body).not.toHaveProperty('shortName');
    expect(body).not.toHaveProperty('slots');
  });

  it('accepts a staff create without a short name, but requires one on an edit', () => {
    const create = { ...emptyOrganizationForm(), name: 'Mới', slug: 'moi' };
    expect(checkOrganizationForm(create, true, true)).toEqual({});
    const edit = { ...toOrganizationForm(detail()), shortName: '' };
    expect(Object.keys(checkOrganizationForm(edit, true, false))).toEqual(['shortName']);
    expect(Object.keys(checkOrganizationForm(edit, false, false))).toEqual([]);
  });

  it('checks a typed seat count as a whole number from 0 to 1 000 000, for staff only', () => {
    const base = { ...emptyOrganizationForm(), name: 'Mới', slug: 'moi' };
    for (const slots of [1.5, -1, 1_000_001]) {
      expect(Object.keys(checkOrganizationForm({ ...base, slots }, true, true))).toEqual(['slots']);
    }
    for (const slots of [0, 1_000_000, null]) {
      expect(checkOrganizationForm({ ...base, slots }, true, true)).toEqual({});
    }
    expect(checkOrganizationForm({ ...base, slots: 1.5 }, false, true)).toEqual({});
  });

  it('checks the slug, the logo and a typed short name that is too long', () => {
    const form = {
      ...emptyOrganizationForm(),
      name: 'A',
      slug: '9bad',
      shortName: 'x'.repeat(21),
      logoOverrideImage: 'javascript:alert(1)',
    };
    expect(Object.keys(checkOrganizationForm(form, true, true)).sort()).toEqual([
      'logoOverrideImage',
      'shortName',
      'slug',
    ]);
  });
});
