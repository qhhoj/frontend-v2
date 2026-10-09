import { describe, expect, it } from 'vitest';
import { emptyImportForm, importFormErrors, toImportOptions } from './import-form';

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

  it('sends no error for a complete form', () => {
    expect(importFormErrors({ ...readyForm(), languageMapText: 'english=en' }, everyMode)).toEqual(
      {},
    );
  });

  it('leaves out the choices the user did not make, and sends the picked ones as ids and pairs', () => {
    const options = toImportOptions({
      ...readyForm(),
      authors: [{ id: 'a1', username: 'an' }],
      languageMapText: 'english=en\nvietnamese=vi',
      points: '1200',
    });
    expect(options).toMatchObject({
      code: 'hcmus41c',
      authors: ['a1'],
      curators: [],
      points: 1200,
      statementLanguages: ['english=en', 'vietnamese=vi'],
    });
    expect(options.groupId).toBeUndefined();
    expect(options.tutorialLanguage).toBeUndefined();
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
