import { describe, expect, it } from 'vitest';
import { mockApi, ok } from '@/test/mock-api';
import { createLanguage, fetchLanguagesAdmin, updateLanguage } from './languages-admin.api';

describe('languages admin calls', () => {
  it('lists, creates and patches a language by its encoded id', async () => {
    const calls = mockApi({
      'GET /admin/languages': ok([]),
      'POST /admin/languages': ok({}),
      'PATCH /admin/languages/l%2F1': ok({}),
    });
    await fetchLanguagesAdmin();
    await createLanguage({
      key: 'CPP20',
      name: 'C++ 20',
      commonName: 'C++',
      ace: 'c_cpp',
      pygments: 'cpp',
      extension: 'cpp',
    });
    await updateLanguage('l/1', { name: 'C++ 20', shortName: null });
    expect(calls[1]!.body).toMatchObject({ key: 'CPP20', extension: 'cpp' });
    expect(calls[2]!.path).toBe('/admin/languages/l%2F1');
    expect(calls[2]!.body).toEqual({ name: 'C++ 20', shortName: null });
  });
});
