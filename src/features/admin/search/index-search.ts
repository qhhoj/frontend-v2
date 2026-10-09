import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ContestPhase } from '@/api/types/contests';

export const INDEX_PAGE_SIZE = 20;
/** The segmented filter of the contests index: `all` is no `phase` at all. */
export const CONTEST_PHASE_FILTERS = ['all', 'running', 'upcoming', 'ended'] as const;
export type ContestPhaseFilter = (typeof CONTEST_PHASE_FILTERS)[number];
const PHASES: readonly string[] = ['running', 'upcoming', 'ended'];

export const phaseFromQuery = (value: unknown): ContestPhase | null =>
  typeof value === 'string' && PHASES.includes(value) ? (value as ContestPhase) : null;

export interface TextPart {
  text: string;
  isHit: boolean;
}

/** `text` cut at every case-insensitive occurrence of `query`; the query is read literally, never as a pattern. */
export function highlightParts(text: string, query: string): TextPart[] {
  const needle = query.toLowerCase();
  if (!needle) return [{ text, isHit: false }];
  const haystack = text.toLowerCase();
  const parts: TextPart[] = [];
  let from = 0;
  for (let hit = haystack.indexOf(needle); hit !== -1; hit = haystack.indexOf(needle, from)) {
    if (hit > from) parts.push({ text: text.slice(from, hit), isHit: false });
    parts.push({ text: text.slice(hit, hit + needle.length), isHit: true });
    from = hit + needle.length;
  }
  if (from < text.length) parts.push({ text: text.slice(from), isHit: false });
  return parts.length > 0 ? parts : [{ text, isHit: false }];
}

/** The address after a search or phase change: empty values leave the address, and the page always starts again at 1. */
export function searchQueryOf(
  current: LocationQuery,
  patch: { q?: string; phase?: string | null },
): LocationQueryRaw {
  const next: LocationQueryRaw = { ...current, page: undefined };
  if (patch.q !== undefined) next.q = patch.q || undefined;
  if (patch.phase !== undefined) {
    next.phase = patch.phase && patch.phase !== 'all' ? patch.phase : undefined;
  }
  return next;
}

/** The backend matches whole words of this length or more; 1 and 2 characters match only the start of a code or name. */
export const WHOLE_WORD_MIN_LENGTH = 3;

export const isShortQuery = (text: string): boolean => text.length < WHOLE_WORD_MIN_LENGTH;
