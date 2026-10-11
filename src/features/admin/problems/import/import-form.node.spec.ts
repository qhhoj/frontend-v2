import { describe, expect, it } from 'vitest';
import { codeFromPolygonName, emptyImportForm, importFormErrors } from './import-form';

const readyForm = () => ({
  ...emptyImportForm(),
  file: new File(['zip'], 'p.zip'),
  code: 'hcmus41c',
});
const everyMode = () => true;

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
    const errors = importFormErrors(
      { ...readyForm(), mode: 'update' },
      (mode) => mode === 'create',
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
    const errors = importFormErrors({ ...emptyImportForm(), code: 'sum' }, () => true, {
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
