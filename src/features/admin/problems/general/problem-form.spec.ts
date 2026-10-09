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
  it('maps per-language limits from language keys to the ids the DTO takes', () => {
    expect(seeded().languageLimits).toEqual([
      { languageId: LANG_PY3, timeLimit: 4.5, memoryLimit: 262144 },
    ]);
  });

  it('sends nothing for an untouched form and only the changed fields otherwise', () => {
    const before = seeded();
    expect(changedProblemFields(before, structuredClone(before))).toEqual({});
    const after = { ...structuredClone(before), points: 1500, partial: false };
    expect(changedProblemFields(before, after)).toEqual({ points: 1500, partial: false });
  });

  it('sends user lists as ids and the date as an ISO instant', () => {
    const before = seeded();
    const after = structuredClone(before);
    after.testers = [...after.testers, { id: 'new-id', username: 'ngocanh' }];
    after.date = '2026-10-08T13:00';
    const patch = changedProblemFields(before, after);
    expect(patch.testers).toEqual(['0192a000-0000-7000-8000-0000000000bb', 'new-id']);
    expect(patch.date).toMatch(/^2026-10-0\dT\d\d:00:00\.000Z$/);
  });

  it('leaves a cleared date out of the patch, since the backend refuses null for it', () => {
    const before = { ...seeded(), date: '2026-10-08T13:00' };
    expect(changedProblemFields(before, { ...before, date: '', points: 1500 })).toEqual({
      points: 1500,
    });
  });

  it('refuses a per-language time limit above 5 s without judge.high_problem_timelimit, beside its row', () => {
    const form = seeded();
    form.languageLimits = [{ ...form.languageLimits[0]!, timeLimit: 6 }];
    expect(checkProblemForm(form, nobodyCan)['languageLimits.0.timeLimit']).toBe(
      'Trên 5 giây cần quyền judge.high_problem_timelimit.',
    );
    expect(
      checkProblemForm(form, (permission) => permission === 'judge.high_problem_timelimit')[
        'languageLimits.0.timeLimit'
      ],
    ).toBeUndefined();
  });

  it('compares lists by value, so reordering a type list is a change and an equal copy is not', () => {
    const before = { ...seeded(), typeIds: ['a', 'b'] };
    expect(changedProblemFields(before, { ...before, typeIds: ['a', 'b'] })).toEqual({});
    expect(changedProblemFields(before, { ...before, typeIds: ['b', 'a'] })).toEqual({
      typeIds: ['b', 'a'],
    });
  });

  it('refuses a time limit above 5 s without judge.high_problem_timelimit, and allows it with', () => {
    const form = { ...seeded(), timeLimit: 6 };
    expect(checkProblemForm(form, nobodyCan).timeLimit).toBe(
      'Trên 5 giây cần quyền judge.high_problem_timelimit.',
    );
    expect(
      checkProblemForm(form, (permission) => permission === 'judge.high_problem_timelimit')
        .timeLimit,
    ).toBeUndefined();
  });

  it('checks the code, the points range and at least one type before sending', () => {
    const errors = checkProblemForm(
      { ...seeded(), code: 'Bad Code', points: 700, typeIds: [] },
      nobodyCan,
    );
    expect(Object.keys(errors).sort()).toEqual(['code', 'points', 'typeIds']);
  });

  it('builds a create body without empty optional fields', () => {
    const defaults = emptyProblemForm(meta);
    const form = { ...defaults, code: 'newp', name: 'New', typeIds: [meta.types[0]!.id] };
    const body = toProblemBody(form, false, defaults);
    expect(body).toMatchObject({
      code: 'newp',
      name: 'New',
      groupId: meta.groups[0]!.id,
      points: 800,
    });
    expect(body).not.toHaveProperty('source');
    expect(body).not.toHaveProperty('date');
    expect(body).not.toHaveProperty('authors');
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
      date: '2026-10-08T13:00',
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
