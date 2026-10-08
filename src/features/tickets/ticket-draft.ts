import {
  TICKET_BODY_MAX_LENGTH,
  TICKET_ISSUE_URL_MAX_LENGTH,
  TICKET_TITLE_MAX_LENGTH,
} from '@/api/types/tickets';
import { codePointCount } from '@/lib/source';

export interface TicketDraft {
  kind: 'problem' | 'general';
  problemCode: string;
  title: string;
  body: string;
  issueUrl: string;
}
export interface DraftIssue {
  field: keyof TicketDraft;
  key: string;
}

/** Mirrors the backend's `IsUrl({ protocols: ['http','https'], require_protocol, disallow_auth })`. */
export function isHttpUrl(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length > TICKET_ISSUE_URL_MAX_LENGTH) return false;
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password;
  } catch {
    return false;
  }
}

const textIssues = (field: 'title' | 'body', text: string, max: number): DraftIssue[] => {
  const length = codePointCount(text.trim());
  if (length === 0) return [{ field, key: `tickets.new.${field}Required` }];
  return length > max ? [{ field, key: `tickets.new.${field}TooLong` }] : [];
};

const targetIssues = (draft: TicketDraft): DraftIssue[] => {
  if (draft.kind === 'general')
    return isHttpUrl(draft.issueUrl) ? [] : [{ field: 'issueUrl', key: 'tickets.new.urlInvalid' }];
  return draft.problemCode.trim()
    ? []
    : [{ field: 'problemCode', key: 'tickets.new.problemRequired' }];
};

/** What keeps the draft from being sent, field by field, in form order. */
export function draftIssues(draft: TicketDraft): DraftIssue[] {
  return [
    ...targetIssues(draft),
    ...textIssues('title', draft.title, TICKET_TITLE_MAX_LENGTH),
    ...textIssues('body', draft.body, TICKET_BODY_MAX_LENGTH),
  ];
}
