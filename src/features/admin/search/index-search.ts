import type { LocationQuery, LocationQueryRaw } from 'vue-router';
import type { ContestPhase } from '@/api/types/contests';

export const INDEX_PAGE_SIZE = 20;
/** The longest search text the address keeps. */
export const SEARCH_MAX_LENGTH = 100;
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

/** One code point, lower-cased when that keeps it one code point; otherwise unchanged, so positions never shift. */
const foldChar = (char: string): string => {
  const lower = char.toLowerCase();
  return Array.from(lower).length === 1 ? lower : char;
};

/** The text as NFC code points, so decomposed Vietnamese (NFD) and composed (NFC) compare equal. */
const codePointsOf = (value: string): string[] => Array.from(value.normalize('NFC'));

/** Where `needle` first occurs in `haystack` at or after `from`, comparing code point by code point; -1 when it does not. */
function indexOfRun(haystack: string[], needle: string[], from: number): number {
  for (let start = from; start + needle.length <= haystack.length; start++) {
    if (needle.every((char, offset) => haystack[start + offset] === char)) return start;
  }
  return -1;
}

/**
 * `text` (NFC) cut at every case-insensitive occurrence of `query` (NFC). Matching runs on code points, so the
 * case fold cannot move a position; the query is read literally, never as a pattern.
 */
export function highlightParts(text: string, query: string): TextPart[] {
  const chars = codePointsOf(text);
  const needle = codePointsOf(query).map(foldChar);
  const whole = [{ text: chars.join(''), isHit: false }];
  if (needle.length === 0) return whole;
  const folded = chars.map(foldChar);
  const parts: TextPart[] = [];
  let from = 0;
  for (
    let hit = indexOfRun(folded, needle, 0);
    hit !== -1;
    hit = indexOfRun(folded, needle, from)
  ) {
    if (hit > from) parts.push({ text: chars.slice(from, hit).join(''), isHit: false });
    parts.push({ text: chars.slice(hit, hit + needle.length).join(''), isHit: true });
    from = hit + needle.length;
  }
  if (from < chars.length) parts.push({ text: chars.slice(from).join(''), isHit: false });
  return parts.length > 0 ? parts : whole;
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
