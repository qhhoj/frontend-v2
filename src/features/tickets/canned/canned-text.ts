import type { TicketDetail } from '@/api/types/tickets';

/** @uiOnly what the placeholders of a canned reply become on this ticket. */
export interface CannedContext {
  creator: string;
  /** The problem name; null for a general ticket. */
  problem: string | null;
}

const NAME_PLACEHOLDER = '{tên}';
const PROBLEM_PLACEHOLDER = '{bài}';

/**
 * Spec 3.12: the SPA fills the placeholders when it inserts the text (the server stores them verbatim). A general ticket has
 * no problem, so `{bài}` stays for the handler to see and edit. Replacers are functions, so `$&` in a name stays literal.
 */
export function fillPlaceholders(body: string, context: CannedContext): string {
  const named = body.replaceAll(NAME_PLACEHOLDER, () => context.creator);
  const problem = context.problem;
  return problem === null ? named : named.replaceAll(PROBLEM_PLACEHOLDER, () => problem);
}

/** After what is already typed, one blank line apart; an empty draft takes the text alone. */
export const appendToDraft = (draft: string, text: string) =>
  draft.trim() === '' ? text : `${draft.trimEnd()}\n\n${text}`;

export const cannedContextOf = (ticket: TicketDetail): CannedContext => ({
  creator: ticket.creator.username,
  problem: ticket.link.type === 'problem' ? ticket.link.title : null,
});
