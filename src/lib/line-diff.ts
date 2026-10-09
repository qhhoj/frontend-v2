import { diffArrays, diffWordsWithSpace } from 'diff';

/** Either side above this many lines is refused before any diff runs (board M6C). */
export const MAX_DIFF_LINES = 5000;
/** Equal lines kept visible on each side of a change when a run is folded. */
export const FOLD_CONTEXT_LINES = 2;
/** A fold hides at least this many equal lines; a shorter run stays open. */
export const MIN_FOLDED_LINES = 3;
/** Word highlighting skips a pair longer than this (minified code) and marks both lines whole. */
export const MAX_WORD_DIFF_CHARS = 2000;

export interface DiffLine {
  /** 1-based line number on its side. */
  number: number;
  text: string;
}
export type DiffRowKind = 'same' | 'changed' | 'removed' | 'added';
export interface DiffRow {
  kind: DiffRowKind;
  left: DiffLine | null;
  right: DiffLine | null;
  /** A removed line whose trimmed text was added elsewhere, or the reverse. */
  isMoved: boolean;
  /** A changed row whose two lines are equal once whitespace runs are collapsed. */
  isWhitespaceOnly: boolean;
}
export interface DiffSummary {
  added: number;
  removed: number;
  same: number;
}
export interface Segment {
  text: string;
  isChanged: boolean;
}
export interface DiffBlock {
  kind: 'open' | 'folded';
  rows: DiffRow[];
}

const LINE_BREAK = /\r\n?/g;
const FINAL_NEWLINE = /\n$/;
const WHITESPACE_RUN = /\s+/g;

/** CRLF and CR become LF and one final newline is dropped, so neither shows as a difference. */
export function splitSourceLines(source: string): string[] {
  const text = source.replace(LINE_BREAK, '\n').replace(FINAL_NEWLINE, '');
  return text === '' ? [] : text.split('\n');
}

export const lineCountOf = (source: string): number => splitSourceLines(source).length;

const collapsed = (text: string) => text.replace(WHITESPACE_RUN, ' ').trim();

interface Cursor {
  left: number;
  right: number;
}

const sameRows = (texts: string[], cursor: Cursor): DiffRow[] =>
  texts.map((text) => ({
    kind: 'same',
    left: { number: ++cursor.left, text },
    right: { number: ++cursor.right, text },
    isMoved: false,
    isWhitespaceOnly: false,
  }));

function hunkRow(left: DiffLine | null, right: DiffLine | null): DiffRow {
  const isPair = left !== null && right !== null;
  return {
    kind: isPair ? 'changed' : left ? 'removed' : 'added',
    left,
    right,
    isMoved: false,
    isWhitespaceOnly: isPair && collapsed(left.text) === collapsed(right.text),
  };
}

/** A removed run and the added run after it: line i beside line i, the longer run's rest alone. */
function hunkRows(removed: string[], added: string[], cursor: Cursor): DiffRow[] {
  const rows: DiffRow[] = [];
  for (let index = 0; index < Math.max(removed.length, added.length); index += 1) {
    const before = removed[index];
    const after = added[index];
    rows.push(
      hunkRow(
        before === undefined ? null : { number: ++cursor.left, text: before },
        after === undefined ? null : { number: ++cursor.right, text: after },
      ),
    );
  }
  return rows;
}

const unpairedTexts = (rows: DiffRow[], kind: 'removed' | 'added') =>
  new Set(
    rows
      .filter((row) => row.kind === kind)
      .map((row) => (row.left ?? row.right)!.text.trim())
      .filter((text) => text !== ''),
  );

/** `diff` has no move detection: an unpaired removed line whose trimmed text was added elsewhere (or the reverse) is a move. */
function markMoves(rows: DiffRow[]): DiffRow[] {
  const removedTexts = unpairedTexts(rows, 'removed');
  const addedTexts = unpairedTexts(rows, 'added');
  return rows.map((row) => {
    const text = (row.left ?? row.right)?.text.trim() ?? '';
    const isMoved =
      (row.kind === 'removed' && addedTexts.has(text)) ||
      (row.kind === 'added' && removedTexts.has(text));
    return isMoved ? { ...row, isMoved } : row;
  });
}

/** Side-by-side rows of two sources: equal lines, changed pairs, lone removals and additions, moves flagged. */
export function lineDiff(left: string, right: string): DiffRow[] {
  const changes = diffArrays(splitSourceLines(left), splitSourceLines(right));
  const cursor: Cursor = { left: 0, right: 0 };
  const rows: DiffRow[] = [];
  for (let index = 0; index < changes.length; index += 1) {
    const change = changes[index]!;
    const next = changes[index + 1];
    if (!change.added && !change.removed) {
      rows.push(...sameRows(change.value, cursor));
      continue;
    }
    const pairsWithNext = change.removed && next?.added === true;
    const removed = change.removed ? change.value : [];
    const added = change.added ? change.value : pairsWithNext ? next.value : [];
    if (pairsWithNext) index += 1;
    rows.push(...hunkRows(removed, added, cursor));
  }
  return markMoves(rows);
}

/** The words of a changed pair, each side rebuilt exactly by joining its segments. */
export function wordSegments(before: string, after: string): { left: Segment[]; right: Segment[] } {
  if (before.length + after.length > MAX_WORD_DIFF_CHARS)
    return { left: [{ text: before, isChanged: true }], right: [{ text: after, isChanged: true }] };
  const changes = diffWordsWithSpace(before, after);
  return {
    left: changes
      .filter((change) => !change.added)
      .map((change) => ({ text: change.value, isChanged: change.removed })),
    right: changes
      .filter((change) => !change.removed)
      .map((change) => ({ text: change.value, isChanged: change.added })),
  };
}

/** End (exclusive) of the run of rows starting at `start` that are all equal or all different. */
function runEnd(rows: DiffRow[], start: number): number {
  const isSame = rows[start]!.kind === 'same';
  let end = start;
  while (end < rows.length && (rows[end]!.kind === 'same') === isSame) end += 1;
  return end;
}

/** An equal run: context kept next to changes (none at the file's edges), the middle folded when long enough. */
function foldRun(
  run: DiffRow[],
  edges: { isFirst: boolean; isLast: boolean },
  contextLines: number,
) {
  const head = edges.isFirst ? 0 : contextLines;
  const tail = edges.isLast ? 0 : contextLines;
  if (run.length - head - tail < MIN_FOLDED_LINES)
    return [{ kind: 'open', rows: run }] as DiffBlock[];
  const blocks: DiffBlock[] = [
    { kind: 'open', rows: run.slice(0, head) },
    { kind: 'folded', rows: run.slice(head, run.length - tail) },
    { kind: 'open', rows: run.slice(run.length - tail) },
  ];
  return blocks.filter((block) => block.rows.length > 0);
}

function mergeOpenBlocks(blocks: DiffBlock[]): DiffBlock[] {
  const merged: DiffBlock[] = [];
  for (const block of blocks) {
    const last = merged.at(-1);
    if (last?.kind === 'open' && block.kind === 'open') last.rows = [...last.rows, ...block.rows];
    else merged.push({ kind: block.kind, rows: [...block.rows] });
  }
  return merged;
}

/** Rows grouped for display: open blocks and folded runs of equal lines ("Hiện 3 dòng giống nhau đã gập"). */
export function foldSameRuns(rows: DiffRow[], contextLines = FOLD_CONTEXT_LINES): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  for (let start = 0; start < rows.length;) {
    const end = runEnd(rows, start);
    const run = rows.slice(start, end);
    if (rows[start]!.kind === 'same')
      blocks.push(
        ...foldRun(run, { isFirst: start === 0, isLast: end === rows.length }, contextLines),
      );
    else blocks.push({ kind: 'open', rows: run });
    start = end;
  }
  return mergeOpenBlocks(blocks);
}

/** Added and removed lines (a changed row counts once on each side) and equal lines. */
export function diffSummary(rows: readonly DiffRow[]): DiffSummary {
  return {
    added: rows.filter((row) => row.kind !== 'same' && row.right !== null).length,
    removed: rows.filter((row) => row.kind !== 'same' && row.left !== null).length,
    same: rows.filter((row) => row.kind === 'same').length,
  };
}

export const isIdentical = (rows: readonly DiffRow[]): boolean =>
  rows.every((row) => row.kind === 'same');
