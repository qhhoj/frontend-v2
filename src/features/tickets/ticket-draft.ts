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

const HTTP_SCHEME = /^https?:\/\//i;
/** validator.js refuses whitespace and angle brackets anywhere in the url. */
const FORBIDDEN_CHARACTERS = /[\s<>]/;
const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6 = /^\[[0-9a-f:.]+\]$/i;
/** A dns label: letters, digits and inner hyphens, at most 63 characters, no underscore. */
const DNS_LABEL = /^[a-z0-9¡-￿](?:[a-z0-9¡-￿-]{0,61}[a-z0-9¡-￿])?$/i;
/** `require_tld`: the last label is letters only (or a punycode `xn--` name). */
const TOP_LEVEL_DOMAIN = /^(?:[a-z¡-￿]{2,}|xn[a-z0-9-]{2,})$/i;
const PORT = /^\d{1,5}$/;
const MAX_PORT = 65535;

const isIPv4 = (host: string): boolean => {
  const match = IPV4.exec(host);
  return match !== null && match.slice(1).every((octet) => Number(octet) <= 255);
};
const isDomainWithTld = (host: string): boolean => {
  const labels = host.split('.');
  return (
    labels.length >= 2 &&
    labels.every((label) => DNS_LABEL.test(label)) &&
    TOP_LEVEL_DOMAIN.test(labels[labels.length - 1] ?? '')
  );
};
const isValidHost = (host: string): boolean =>
  host.startsWith('[') ? IPV6.test(host) : isIPv4(host) || isDomainWithTld(host);
const isValidPort = (port: string | undefined): boolean =>
  port === undefined || (PORT.test(port) && Number(port) <= MAX_PORT);

/** Host, then an optional port: `[v6]:8080`, `example.com:443`, `example.com`. */
const isValidAuthority = (authority: string): boolean => {
  const match = /^(\[[^\]]*\]|[^:]*)(?::(.*))?$/.exec(authority);
  return match !== null && isValidHost(match[1] ?? '') && isValidPort(match[2]);
};

/**
 * Mirrors the backend's `@IsUrl({ protocols: ['http','https'], require_protocol, disallow_auth })`, which is
 * validator.js with its defaults: a real host with a TLD (or an IP), an optional port, no credentials.
 * The 200-character cap is the backend's `@MaxLength`.
 */
export function isHttpUrl(text: string): boolean {
  const url = text.trim();
  if (url.length > TICKET_ISSUE_URL_MAX_LENGTH || FORBIDDEN_CHARACTERS.test(url)) return false;
  const scheme = HTTP_SCHEME.exec(url);
  if (!scheme) return false;
  const authority = url.slice(scheme[0].length).split(/[/?#]/)[0] ?? '';
  return !authority.includes('@') && isValidAuthority(authority);
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
