import type { LiveStatus, ParticipationSummary } from '@/api/types/contests';
import type { ContestActionKind } from './contest-action';

/** backend: the stored rules are trimmed and a blank text means no rules, so whitespace never asks for acceptance. */
export const hasRules = (rules: string): boolean => rules.trim() !== '';

/**
 * backend (B3 Task 4): acceptance is stored on every new row: a registration, a first live join (no row yet) and every virtual
 * join. Joining a registered row, re-entering and spectating create nothing to accept.
 */
export function needsRulesAcceptance(
  kind: ContestActionKind,
  liveStatus: LiveStatus | null,
): boolean {
  if (kind === 'register' || kind === 'virtual') return true;
  return kind === 'join' && liveStatus === null;
}

/** List bullets, numbers and heading marks at a line start; emphasis and code marks anywhere. */
const LEADING_MARKS = /^[\s#>*+\-\d.)]+/;
const INLINE_MARKS = /[*_`~]/g;
const EXCERPT_LENGTH = 140;

/** The card's one-line preview: each non-empty line without its markdown marks, joined by a dot, cut by code points. */
export function rulesExcerpt(markdown: string, maxLength = EXCERPT_LENGTH): string {
  const text = markdown
    .split('\n')
    .map((line) => line.replace(LEADING_MARKS, '').replace(INLINE_MARKS, '').trim())
    .filter(Boolean)
    .join(' · ');
  const characters = Array.from(text);
  if (characters.length <= maxLength) return text;
  return `${characters
    .slice(0, maxLength - 1)
    .join('')
    .trimEnd()}…`;
}

export interface RulesAcceptance {
  revision: number;
  at: string;
}

/** What a participation accepted, or null when it accepted nothing (no rules then, or a row that predates rules). */
export function acceptanceOf(participation: ParticipationSummary | null): RulesAcceptance | null {
  if (!participation) return null;
  const { rulesAcceptedAt: at, rulesAcceptedRevision: revision } = participation;
  return at === null || revision === null ? null : { revision, at };
}
