import { hasIssueCode, failureTextOf } from '@/features/admin/ui/admin-errors';
import { translate } from '@/i18n';

/** Refusal issue codes of the tag and bulk writes (`error.issues[].code`) and the text key of each. */
const ISSUE_TEXT_KEYS: Record<string, string> = {
  unknown_tag: 'orgProblems.errors.unknownTag',
  unexpected_tag: 'errors.unexpected_tag',
  tag_limit_reached: 'errors.tag_limit_reached',
  slug_taken: 'orgProblems.errors.slugTaken',
};

/** The text of a failed organization-problems write: its issue code first, then the generic refusal text with any wait. */
export function orgFailureText(error: unknown): string {
  const code = Object.keys(ISSUE_TEXT_KEYS).find((candidate) => hasIssueCode(error, candidate));
  return code ? translate(ISSUE_TEXT_KEYS[code]!) : failureTextOf(error);
}
