import { describe, expect, it } from 'vitest';
import { emptyImportForm, importFormErrors, toImportOptions } from './import-form';

const readyForm = () => ({
  ...emptyImportForm(),
  file: new File(['zip'], 'p.zip'),
  code: 'hcmus41c',
});

describe('import form', () => {
  it('refuses a missing file, a bad code and a language pair the backend would answer 400 for', () => {
    const errors = importFormErrors({
      ...emptyImportForm(),
      code: 'Hcmus-41',
      languageMapText: 'english=en, x_y=vi',
    });
    expect(Object.keys(errors).sort()).toEqual(['code', 'file', 'statementLanguages']);
    expect(errors.statementLanguages).toContain('x_y=vi');
  });

  it('sends no error for a complete form', () => {
    expect(importFormErrors({ ...readyForm(), languageMapText: 'english=en' })).toEqual({});
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
});
