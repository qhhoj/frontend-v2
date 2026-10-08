import { ApiError } from '@/api/client';
import type { FieldIssue } from '@/api/client';
import { DEFAULT_LOCALE, i18n, translate } from '@/i18n';
import { errorMessageKey } from '@/i18n/error-message';

/** B8: the moderator's reason is a member of the `banned` error; the English message is never parsed. */
export function banReason(error: unknown): string | null {
  if (!(error instanceof ApiError) || error.code !== 'banned') return null;
  const reason = error.extra.banReason;
  return typeof reason === 'string' && reason.trim() ? reason.trim() : null;
}

/** The one place an auth failure becomes text for the viewer. */
export function authErrorText(error: unknown): string {
  const reason = banReason(error);
  if (reason) return translate('errors.bannedWithReason', { reason });
  // The browser's WebAuthn API rejects with a DOMException (blocked origin, no authenticator, ...).
  if (error instanceof DOMException) return translate('errors.webauthn_failed');
  return translate(errorMessageKey(error));
}

/** Codes that arrive as the bare constraint name: `PasswordResetRequestDto.email` has no `context.code` (ask A1). */
const ISSUE_ALIASES: Readonly<Record<string, string>> = { 'email.matches': 'email_invalid' };

/** The translated text of an issue code, or null when the interface has none. */
function knownIssueText({ field, code }: FieldIssue): string | null {
  const key = `auth.issues.${ISSUE_ALIASES[`${field}.${code}`] ?? code}`;
  return i18n.global.te(key, DEFAULT_LOCALE) ? translate(key) : null;
}

/** By code (B10); a code without text shows the backend's English message. */
export const issueText = (issue: FieldIssue): string => knownIssueText(issue) ?? issue.message;

/** Known issues on fields the form does not render: the one line that can still explain them. */
export const hiddenIssueTexts = (error: unknown, visibleFields: readonly string[]): string[] =>
  error instanceof ApiError
    ? error.issues
        .filter((issue) => !visibleFields.includes(issue.field))
        .flatMap((issue) => knownIssueText(issue) ?? [])
    : [];

/** Field name -> its messages, translated and joined; from `issues`, else from the older `fields` map; empty for other errors. */
export function fieldErrorTexts(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError)) return {};
  const messages: [string, string][] = error.issues.length
    ? error.issues.map((issue) => [issue.field, issueText(issue)])
    : Object.entries(error.fields).flatMap(([field, texts]) =>
        texts.map((text): [string, string] => [field, text]),
      );
  const joined = new Map<string, string>();
  for (const [field, text] of messages)
    joined.set(field, joined.has(field) ? `${joined.get(field)} ${text}` : text);
  return Object.fromEntries(joined);
}

/** What `/login?error=<code>` may carry after a social sign-in (`SocialService.loginError`); anything else is ignored. */
const CALLBACK_ERROR_CODES: readonly string[] = [
  'oauth_state',
  'oauth_failed',
  'email_unverified',
  'banned',
  'account_not_activated',
];

export const queryErrorText = (value: unknown): string | null =>
  typeof value === 'string' && CALLBACK_ERROR_CODES.includes(value)
    ? translate(`errors.${value}`)
    : null;
