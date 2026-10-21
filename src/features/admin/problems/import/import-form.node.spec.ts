import { describe, expect, it } from 'vitest';
import {
  canCreateFor,
  codeFromPolygonName,
  missingForMode,
  emptyImportForm,
  importFormErrors,
  toImportOptions,
} from './import-form';

const readyForm = () => ({
  ...emptyImportForm(),
  file: new File(['zip'], 'p.zip'),
  code: 'hcmus41c',
});
const everyMode = () => null;

describe('import form', () => {
  it('refuses a missing file, a bad code and a language pair the backend would answer 400 for', () => {
    const errors = importFormErrors(
      { ...emptyImportForm(), code: 'Hcmus-41', languageMapText: 'english=en, x_y=vi' },
      everyMode,
    );
    expect(Object.keys(errors).sort()).toEqual(['code', 'file', 'statementLanguages']);
    expect(errors.statementLanguages).toContain('x_y=vi');
  });

  it('refuses a mode the viewer may not use, so the import is never sent to a 403', () => {
    const errors = importFormErrors({ ...readyForm(), mode: 'update' }, (mode) =>
      mode === 'update' ? 'judge.edit_own_problem' : null,
    );
    expect(Object.keys(errors)).toEqual(['mode']);
    expect(errors.mode).toContain('judge.edit_own_problem');
  });

  it.each([
    ['799', true],
    ['800', false],
    ['3500', false],
    ['3501', true],
    ['12.5', true],
    ['-1', true],
    ['', false],
  ])('checks points %s against the backend range (refused: %s)', (points, refused) => {
    const errors = importFormErrors({ ...readyForm(), points }, everyMode);
    expect(Boolean(errors.points)).toBe(refused);
  });

  it('refuses a language name longer than the backend allows (30 characters)', () => {
    const errors = importFormErrors(
      { ...readyForm(), mainStatementLanguage: 'a'.repeat(30), tutorialLanguage: 'b'.repeat(31) },
      everyMode,
    );
    expect(Object.keys(errors)).toEqual(['tutorialLanguage']);
  });
});

describe('importFormErrors without a file', () => {
  it('does not ask for a file when the package comes from Polygon', () => {
    const errors = importFormErrors({ ...emptyImportForm(), code: 'sum' }, everyMode, {
      needsFile: false,
    });
    expect(errors).toEqual({});
  });
});

describe('codeFromPolygonName', () => {
  it.each([
    ['xau-doi-xung', 'xau_doi_xung'],
    ['Dem-Cap--Chia.Het', 'dem_cap_chia_het'],
    ['-a-', 'a'],
    ['a'.repeat(40), 'a'.repeat(32)],
    ['---', ''],
  ])('turns %s into %s', (name, code) => {
    expect(codeFromPolygonName(name)).toBe(code);
  });
});

describe('import owner', () => {
  const school = { slug: 'thpt-a', name: 'THPT A', shortName: 'A', problemCodePrefix: 'thpta_' };

  it.each([
    [
      'an organization with the organization scope',
      school,
      { site: false, organizations: true },
      true,
    ],
    ['an organization without it', school, { site: true, organizations: false }, false],
    ['the site with judge.add_problem', null, { site: true, organizations: false }, true],
    ['the site without it', null, { site: false, organizations: true }, false],
  ])('creating for %s is allowed: %s', (_case, owner, scope, allowed) => {
    expect(canCreateFor(owner, scope)).toBe(allowed);
  });

  it('sends the owner organization on create only, and nothing for the site', () => {
    const form = { ...emptyImportForm(), code: 'thpta_sum', owner: school };
    expect(toImportOptions(form).organization).toBe('thpt-a');
    expect(toImportOptions({ ...form, mode: 'update' }).organization).toBeUndefined();
    expect(toImportOptions({ ...form, owner: null }).organization).toBeUndefined();
  });
});

describe('toImportOptions empty choices', () => {
  it('leaves out empty lists and blank text, so a JSON body never clears the stored catalog', () => {
    const options = toImportOptions({ ...readyForm(), mainStatementLanguage: '  ' });
    expect(options.authors).toBeUndefined();
    expect(options.curators).toBeUndefined();
    expect(options.typeIds).toBeUndefined();
    expect(options.statementLanguages).toBeUndefined();
    expect(options.mainStatementLanguage).toBeUndefined();
  });

  it('sends the chosen lists', () => {
    const form = { ...readyForm(), typeIds: ['t1'], authors: [{ id: 'a1', username: 'bitcoder' }] };
    expect(toImportOptions(form)).toMatchObject({ typeIds: ['t1'], authors: ['a1'] });
  });
});

describe('import rights', () => {
  const rights = (site: boolean, organizations: boolean, canRelink = true) => ({
    canEditOwn: true,
    canRelink,
    scope: { site, organizations },
  });

  it('needs a creation scope, site or organization, to create', () => {
    expect(missingForMode('create', rights(false, false))).toBe('judge.add_problem');
    expect(missingForMode('create', rights(true, false))).toBeNull();
    expect(missingForMode('create', rights(false, true))).toBeNull();
  });

  it('needs edit_own_problem to update, and the sync permission to relink a Polygon problem', () => {
    expect(missingForMode('update', { ...rights(false, false), canEditOwn: false })).toBe(
      'judge.edit_own_problem',
    );
    expect(missingForMode('update', rights(false, false))).toBeNull();
    expect(missingForMode('update', rights(true, true, false))).toBe('judge.sync_polygon_problem');
  });
});
