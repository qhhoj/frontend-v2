import { describe, expect, it } from 'vitest';
import { editableProblem, LANG_PY3, problemEditingMeta } from '@/test/admin-fixtures/problems';
import {
  changedProblemFields,
  checkProblemForm,
  emptyProblemForm,
  STAFF_ONLY_FIELDS,
  toProblemBody,
  toProblemForm,
} from './problem-form';
import type { ProblemForm } from './problem-form';

const meta = problemEditingMeta();
const seeded = () => toProblemForm(editableProblem(), meta);
const nobodyCan = () => false;

describe('problem form', () => {
  it('sends nothing for an untouched form and only the changed fields otherwise', () => {
    const before = seeded();
    expect(changedProblemFields(before, structuredClone(before))).toEqual({});
    const after = { ...structuredClone(before), points: 1500, partial: false };
    expect(changedProblemFields(before, after)).toEqual({ points: 1500, partial: false });
  });

  it('sends user lists as ids and the date as the ISO instant it holds', () => {
    const before = seeded();
    const after = structuredClone(before);
    after.testers = [...after.testers, { id: 'new-id', username: 'ngocanh' }];
    after.date = '2026-10-08T06:00:00.000Z';
    const patch = changedProblemFields(before, after);
    expect(patch.testers).toEqual(['0192a000-0000-7000-8000-0000000000bb', 'new-id']);
    expect(patch.date).toBe('2026-10-08T06:00:00.000Z');
  });

  it('sends a cleared date as null so it is unset', () => {
    const before = { ...seeded(), date: '2026-10-08T06:00:00.000Z' };
    expect(changedProblemFields(before, { ...before, date: null, points: 1500 })).toEqual({
      date: null,
      points: 1500,
    });
  });

  it('refuses a per-language time limit above 5 s without judge.high_problem_timelimit, beside its row', () => {
    const form = seeded();
    form.languageLimits = [{ ...form.languageLimits[0]!, timeLimit: 6 }];
    expect(checkProblemForm(form, nobodyCan)['languageLimits.0.timeLimit']).toBe(
      'Trên 5 giây cần quyền “Đặt giới hạn thời gian cao”.',
    );
    expect(
      checkProblemForm(form, (permission) => permission === 'judge.high_problem_timelimit')[
        'languageLimits.0.timeLimit'
      ],
    ).toBeUndefined();
    const high = { ...seeded(), timeLimit: 6 };
    expect(checkProblemForm(high, nobodyCan).timeLimit).toBe(
      'Trên 5 giây cần quyền “Đặt giới hạn thời gian cao”.',
    );
  });

  it('compares lists by value, so reordering a type list is a change and an equal copy is not', () => {
    const before = { ...seeded(), typeIds: ['a', 'b'] };
    expect(changedProblemFields(before, { ...before, typeIds: ['a', 'b'] })).toEqual({});
    expect(changedProblemFields(before, { ...before, typeIds: ['b', 'a'] })).toEqual({
      typeIds: ['b', 'a'],
    });
  });

  it('checks the code, the points range and at least one type before sending', () => {
    const errors = checkProblemForm(
      { ...seeded(), code: 'Bad Code', points: 700, typeIds: [] },
      nobodyCan,
    );
    expect(Object.keys(errors).sort()).toEqual(['code', 'points', 'typeIds']);
  });

  it('asks for a code and a name; an organization prefix alone is no code', () => {
    const empty = { ...seeded(), code: '', name: '  ' };
    expect(Object.keys(checkProblemForm(empty, nobodyCan))).toEqual(
      expect.arrayContaining(['code', 'name']),
    );
    const prefixOnly = checkProblemForm({ ...seeded(), code: 'vx_alpha_' }, nobodyCan, 'vx_alpha_');
    expect(prefixOnly.code).toBe('Nhập mã bài.');
    expect(
      checkProblemForm({ ...seeded(), code: 'vx_alpha_p1' }, nobodyCan, 'vx_alpha_').code,
    ).toBe(undefined);
  });

  it('never sends a staff-only field from a viewer without judge.edit_all_problem, even when filled', () => {
    const defaults = emptyProblemForm(meta);
    const filled: ProblemForm = {
      ...defaults,
      code: 'newp',
      name: 'New',
      typeIds: [meta.types[0]!.id],
      authors: [{ id: 'a1', username: 'a' }],
      curators: [{ id: 'c1', username: 'c' }],
      bannedUsers: [{ id: 'b1', username: 'b' }],
      licenseId: 'license-1',
      summary: 'Tóm tắt',
      ogImage: '/img/x.png',
      allowedLanguages: [LANG_PY3],
      organizations: [{ id: 'org-1', slug: 'thpt-hung-vuong' }],
      isOrganizationPrivate: true,
      testcaseResultVisibility: 'S',
      allowViewFeedback: true,
      date: '2026-10-08T06:00:00.000Z',
    };
    const body = toProblemBody(filled, false, defaults);
    for (const field of STAFF_ONLY_FIELDS) expect(body, field).not.toHaveProperty(field);
    expect(body).toMatchObject({ code: 'newp', name: 'New' });
  });

  it('sends a staff-only field from a staff creator only when it differs from the default, so the language list stays the backend default until edited', () => {
    const defaults = emptyProblemForm(meta);
    const base = { ...defaults, code: 'newp', name: 'New', typeIds: [meta.types[0]!.id] };
    const untouched = toProblemBody({ ...base, summary: 'Tóm tắt' }, true, defaults);
    expect(untouched).toMatchObject({ summary: 'Tóm tắt' });
    expect(untouched).not.toHaveProperty('allowedLanguages');
    const edited = toProblemBody({ ...base, allowedLanguages: [LANG_PY3] }, true, defaults);
    expect(edited.allowedLanguages).toEqual([LANG_PY3]);
  });

  it('keeps the name out of a patch unless it was edited, so a translated name never overwrites the base name', () => {
    const before = seeded();
    expect(
      changedProblemFields(before, { ...structuredClone(before), points: 900 }),
    ).not.toHaveProperty('name');
    expect(changedProblemFields(before, { ...structuredClone(before), name: 'Tên mới' })).toEqual({
      name: 'Tên mới',
    });
  });
});
