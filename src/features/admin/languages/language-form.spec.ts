import { describe, expect, it } from 'vitest';
import { languageAdmin } from '@/test/admin-fixtures/languages';
import {
  checkLanguageForm,
  createBodyOf,
  emptyLanguageForm,
  formOf,
  megabytesOf,
  patchOf,
} from './language-form';

const kotlin = () => ({
  ...emptyLanguageForm(),
  key: 'KOTLIN',
  name: 'Kotlin',
  commonName: 'Kotlin',
  ace: 'kotlin',
  pygments: 'kotlin',
  extension: 'kt',
});

describe('language form', () => {
  it('accepts a complete form and starts from the backend defaults', () => {
    expect(checkLanguageForm(kotlin(), 'create')).toEqual({});
    expect(emptyLanguageForm()).toMatchObject({
      fileOnly: false,
      includeInProblem: false,
      fileSizeLimit: '0',
    });
  });

  it('refuses what the backend would refuse, field by field', () => {
    const errors = checkLanguageForm(
      {
        ...kotlin(),
        key: 'a b',
        name: '',
        shortName: 'x'.repeat(21),
        ace: 'x'.repeat(51),
        extension: 'KT',
        fileSizeLimit: '1073741825',
        template: 'x'.repeat(65_537),
      },
      'create',
    );
    expect(Object.keys(errors).sort()).toEqual([
      'ace',
      'extension',
      'fileSizeLimit',
      'key',
      'name',
      'shortName',
      'template',
    ]);
  });

  it('does not check the key on edit, where it cannot change', () => {
    expect(checkLanguageForm({ ...kotlin(), key: '' }, 'edit')).toEqual({});
  });

  it('takes a non-numeric or fractional file size as an error and 0 as valid', () => {
    for (const bad of ['', '-1', '1.5', '64MB'])
      expect(
        checkLanguageForm({ ...kotlin(), fileSizeLimit: bad }, 'create').fileSizeLimit,
        bad,
      ).toBeDefined();
    expect(
      checkLanguageForm({ ...kotlin(), fileSizeLimit: '0' }, 'create').fileSizeLimit,
    ).toBeUndefined();
  });

  it('builds the create body without an empty short name and with the size as a number', () => {
    expect(
      createBodyOf({ ...kotlin(), fileSizeLimit: '67108864', includeInProblem: true }),
    ).toEqual({
      key: 'KOTLIN',
      name: 'Kotlin',
      commonName: 'Kotlin',
      ace: 'kotlin',
      pygments: 'kotlin',
      extension: 'kt',
      fileOnly: false,
      fileSizeLimit: 67108864,
      includeInProblem: true,
      template: '',
      info: '',
      description: '',
    });
    expect(createBodyOf({ ...kotlin(), shortName: 'KT' }).shortName).toBe('KT');
  });

  it('sends only the fields that changed', () => {
    const before = languageAdmin({ shortName: 'RS', fileSizeLimit: 0 });
    expect(patchOf(before, formOf(before))).toEqual({});
    expect(
      patchOf(before, {
        ...formOf(before),
        name: 'Rust 2021',
        fileOnly: true,
        fileSizeLimit: '1024',
      }),
    ).toEqual({
      name: 'Rust 2021',
      fileOnly: true,
      fileSizeLimit: 1024,
    });
  });

  it('clears the short name with null, and never sends an empty one that was already empty', () => {
    const named = languageAdmin({ shortName: 'RS' });
    expect(patchOf(named, { ...formOf(named), shortName: '' })).toEqual({ shortName: null });
    const unnamed = languageAdmin({ shortName: null });
    expect(patchOf(unnamed, formOf(unnamed))).toEqual({});
    expect(patchOf(unnamed, { ...formOf(unnamed), shortName: 'RS' })).toEqual({ shortName: 'RS' });
  });

  it('shows the file size limit in whole megabytes only while it is a valid number', () => {
    expect(megabytesOf('67108864')).toBe(64);
    expect(megabytesOf('abc')).toBeNull();
    expect(megabytesOf('')).toBeNull();
  });
});
