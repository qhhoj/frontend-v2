import { describe, expect, it } from 'vitest';
import type { AuditEntry } from '@/api/types/audit-admin';
import { auditFilterFromQuery, auditObjectLink, toAuditRequest } from './audit';

const entry = (patch: Partial<AuditEntry>): AuditEntry => ({
  id: '0192a000-0000-7000-8000-000000000001',
  at: '2026-10-11T08:00:00Z',
  actor: null,
  type: 'problem',
  action: 'edit',
  object: { id: '0192a000-0000-7000-8000-0000000000aa', label: 'aplusb', deleted: false },
  changedFields: [],
  comment: '',
  ...patch,
});

describe('audit feed helpers', () => {
  it('keeps only a known type and real days from the URL', () => {
    expect(
      auditFilterFromQuery({ actor: ' tuan_k ', type: 'nonsense', from: '2026-10-01', to: 'x' }),
    ).toEqual({ actor: 'tuan_k', type: '', from: '2026-10-01', to: '' });
  });

  it('sends the day range as local midnights, the last day included', () => {
    const request = toAuditRequest({ actor: '', type: '', from: '2026-10-01', to: '2026-10-01' });
    expect(request).toEqual({
      from: new Date(2026, 9, 1).toISOString(),
      to: new Date(2026, 9, 2).toISOString(),
    });
    expect(toAuditRequest({ actor: '', type: '', from: '', to: '2026-12-31' }).to).toBe(
      new Date(2027, 0, 1).toISOString(),
    );
  });

  it('links an object only while it exists and has a screen', () => {
    expect(auditObjectLink(entry({}))).toEqual({
      name: 'admin-problemGeneral',
      params: { code: 'aplusb' },
    });
    const gone = entry({ object: { id: 'x', label: 'aplusb', deleted: true } });
    expect(auditObjectLink(gone)).toBeNull();
    expect(auditObjectLink(entry({ type: 'comment' }))).toBeNull();
    expect(
      auditObjectLink(
        entry({ type: 'setting', object: { id: 'mail.from', label: 'mail.from', deleted: false } }),
      ),
    ).toEqual({
      name: 'admin-log',
      query: { view: 'settings', key: 'mail.from' },
    });
  });
});
