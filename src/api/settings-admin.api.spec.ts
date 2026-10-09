import { describe, expect, it } from 'vitest';
import { mockApi, ok, page } from '@/test/mock-api';
import {
  SETTING_REVISIONS_PAGE_SIZE,
  fetchSettingRevisions,
  fetchSettings,
  restoreSettingRevision,
  updateSetting,
} from './settings-admin.api';

describe('settings admin calls', () => {
  it('lists settings and patches one by key with its value', async () => {
    const calls = mockApi({
      'GET /admin/settings': ok([]),
      'PATCH /admin/settings/mail.from': ok({}),
    });
    await fetchSettings();
    await updateSetting('mail.from', 'a@b.c');
    expect(calls[1]!.path).toBe('/admin/settings/mail.from');
    expect(calls[1]!.body).toEqual({ value: 'a@b.c' });
  });

  it('reads a revision page at the fixed size and restores a revision by id', async () => {
    const calls = mockApi({
      'GET /admin/settings/mail.from/revisions': page([]),
      'POST /admin/settings/mail.from/revisions/r%2F1/restore': ok({}),
    });
    await fetchSettingRevisions('mail.from', 2);
    await restoreSettingRevision('mail.from', 'r/1');
    expect(calls[0]!.query.get('page')).toBe('2');
    expect(calls[0]!.query.get('pageSize')).toBe(String(SETTING_REVISIONS_PAGE_SIZE));
    expect(calls[1]!.method).toBe('POST');
  });
});
