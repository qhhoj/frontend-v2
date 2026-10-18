import type { AuditEntry } from '@/api/types/audit-admin';
import { shortId } from '../ui/short-id';

/** The translator the sentence needs: a text when the key exists, else nothing. */
export type TextOf = (key: string) => string | null;

/** The words of one change as a sentence ("bitcoder đã sửa bài tập trash_02"); the page puts them in `admin.audit.sentence`. */
export interface AuditSentence {
  /** The username, a short id when the account is gone, or null for a system write. */
  actor: string | null;
  /** The verb phrase ("đã sửa"); an action the client has no words for reads as its code. */
  verb: string;
  /** The kind in lower case ("bài tập"); an unknown kind reads as its code. */
  noun: string;
  /** The object's label, or a short id when it has none. */
  object: string;
}

export function auditSentence(entry: AuditEntry, textOf: TextOf): AuditSentence {
  return {
    actor: entry.actor ? (entry.actor.username ?? shortId(entry.actor.id)) : null,
    verb: textOf(`admin.audit.verbs.${entry.action}`) ?? entry.action,
    noun: textOf(`admin.audit.nouns.${entry.type}`) ?? entry.type,
    object: entry.object.label ?? shortId(entry.object.id),
  };
}
