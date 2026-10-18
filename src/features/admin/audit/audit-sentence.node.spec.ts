import { describe, expect, it } from 'vitest';
import type { AuditEntry } from '@/api/types/audit-admin';
import { auditSentence } from './audit-sentence';

const entry = (patch: Partial<AuditEntry>): AuditEntry => ({
  id: '0192c5a1-0000-7000-8000-0e6d1f4a9c21',
  at: '2026-10-18T03:00:00.000Z',
  actor: { id: '0192c5a1-1111-7000-8000-0e6d1f4a9c21', username: 'bitcoder' },
  type: 'problem',
  action: 'edit',
  object: { id: '0192c5a1-2222-7000-8000-0e6d1f4a9c21', label: 'trash_02', deleted: false },
  changedFields: ['description'],
  comment: '',
  ...patch,
});
const TEXTS: Record<string, string> = {
  'admin.audit.verbs.edit': 'đã sửa',
  'admin.audit.nouns.problem': 'bài tập',
};
const textOf = (key: string) => TEXTS[key] ?? null;

describe('auditSentence', () => {
  it('names who did what to which object', () => {
    expect(auditSentence(entry({}), textOf)).toEqual({
      actor: 'bitcoder',
      verb: 'đã sửa',
      noun: 'bài tập',
      object: 'trash_02',
    });
  });

  it('falls back to the codes for an action or kind the client has no words for', () => {
    const sentence = auditSentence(entry({ action: 'staff_merge', type: 'badge' }), textOf);
    expect([sentence.verb, sentence.noun]).toEqual(['staff_merge', 'badge']);
  });

  it('marks a system write, and shortens the id of a nameless account or object', () => {
    expect(auditSentence(entry({ actor: null }), textOf).actor).toBeNull();
    const nameless = auditSentence(
      entry({
        actor: { id: '0192c5a1-1111-7000-8000-0e6d1f4a9c21', username: null },
        object: { id: '0192c5a1-2222-7000-8000-0e6d1f4a9c21', label: null, deleted: false },
      }),
      textOf,
    );
    expect([nameless.actor, nameless.object]).toEqual(['0192…9c21', '0192…9c21']);
  });
});
