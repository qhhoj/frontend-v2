/**
 * "Tạo test từ gói zip": pairs the archive's input files with its output files, one test per pair.
 *
 * Naming rules (by the file's own name, case-insensitive; the folder path is kept and must match):
 * - input: the name ends in `.in` or `.inp`, or starts with `input`;
 * - output: the name ends in `.out`, `.ans` or `.ok`, or starts with `output`;
 * - an extension decides first (`output.in` is an input), the `input`/`output` prefix only when no listed extension;
 * - the pairing key is the folder plus the name without its last extension and without a leading `input`/`output`
 *   (`1.in` ↔ `1.out`, `test01/bai.inp` ↔ `test01/bai.out`, `input1.txt` ↔ `output1.txt`, `input1.in` ↔ `output1.out`,
 *   `test01/input.txt` ↔ `test01/output.txt`), compared case-insensitively;
 * - two files of one side on one key: the first in `.in`, `.inp`, `input*` (inputs) or `.out`, `.ans`, `.ok`, `output*`
 *   (outputs) order wins, the other is left unpaired;
 * - `__MACOSX/` entries and dot files are ignored; every other file is listed as unpaired or as an other file.
 */

export interface FilePair {
  key: string;
  input: string;
  output: string;
}

export interface ArchivePairing {
  pairs: FilePair[];
  /** Inputs and outputs that found no partner (or lost to a preferred one). */
  unpaired: string[];
  /** Files that are neither: init.yml, checkers, statements. */
  others: string[];
}

type Side = 'input' | 'output';
interface Marked {
  side: Side;
  key: string;
  rank: number;
}

const EXTENSIONS: Record<Side, string[]> = {
  input: ['.in', '.inp'],
  output: ['.out', '.ans', '.ok'],
};
const SIDES: Side[] = ['input', 'output'];
/** Natural order: `2` before `10`, `test2/` before `test10/`. */
const naturalOrder = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });

export const compareNatural = (left: string, right: string) =>
  naturalOrder.compare(left, right) || (left < right ? -1 : left > right ? 1 : 0);

const splitPath = (path: string) => {
  const slash = path.lastIndexOf('/');
  return { folder: path.slice(0, slash + 1), name: path.slice(slash + 1) };
};
const withoutExtension = (name: string) =>
  name.includes('.') ? name.slice(0, name.lastIndexOf('.')) : name;

const isIgnored = (path: string) =>
  path.startsWith('__MACOSX/') || splitPath(path).name.startsWith('.');

/** The name without its extension and without a leading `input`/`output` of its own side. */
function stemOf(name: string, side: Side) {
  const bare = withoutExtension(name);
  return bare.toLowerCase().startsWith(side) ? bare.slice(side.length) : bare;
}

const sideOf = (lowerName: string): { side: Side; rank: number } | null => {
  for (const side of SIDES) {
    const rank = EXTENSIONS[side].findIndex((extension) => lowerName.endsWith(extension));
    if (rank >= 0) return { side, rank };
  }
  const side = SIDES.find((candidate) => lowerName.startsWith(candidate));
  return side ? { side, rank: EXTENSIONS[side].length } : null;
};

/** Which side a file is on, its pairing key, and its preference rank on that side; null for any other file. */
export function markFile(path: string): Marked | null {
  const { folder, name } = splitPath(path);
  const found = sideOf(name.toLowerCase());
  return found ? { ...found, key: `${folder}${stemOf(name, found.side)}`.toLowerCase() } : null;
}

/** Per key, the preferred file of one side; the files it beat go to `losers`. */
function pickPerKey(files: { path: string; mark: Marked }[], losers: string[]) {
  const chosen = new Map<string, { path: string; rank: number }>();
  for (const { path, mark } of files) {
    const held = chosen.get(mark.key);
    if (held && held.rank <= mark.rank) {
      losers.push(path);
      continue;
    }
    if (held) losers.push(held.path);
    chosen.set(mark.key, { path, rank: mark.rank });
  }
  return chosen;
}

/** Pairs inputs with outputs by key, in natural order of the input's path. */
export function pairArchiveFiles(files: string[]): ArchivePairing {
  const unpaired: string[] = [];
  const others: string[] = [];
  const marked = { input: [], output: [] } as Record<Side, { path: string; mark: Marked }[]>;
  for (const path of [...files].sort(compareNatural)) {
    if (path.endsWith('/') || isIgnored(path)) continue;
    const mark = markFile(path);
    if (mark) marked[mark.side].push({ path, mark });
    else others.push(path);
  }
  const inputs = pickPerKey(marked.input, unpaired);
  const outputs = pickPerKey(marked.output, unpaired);
  const pairs: FilePair[] = [];
  for (const [key, input] of inputs) {
    const output = outputs.get(key);
    if (output) pairs.push({ key, input: input.path, output: output.path });
    else unpaired.push(input.path);
  }
  for (const [key, output] of outputs) if (!inputs.has(key)) unpaired.push(output.path);
  return {
    pairs: pairs.sort((left, right) => compareNatural(left.input, right.input)),
    unpaired: unpaired.sort(compareNatural),
    others: others.sort(compareNatural),
  };
}

/** The total split shares when the problem has no usable one. */
export const DEFAULT_TOTAL_POINTS = 100;

/** A positive whole number of points, else the default. */
export const totalPointsOf = (points: number | null | undefined) =>
  points !== null && points !== undefined && Number.isSafeInteger(points) && points > 0
    ? points
    : DEFAULT_TOTAL_POINTS;

/** `count` whole shares adding up to `total`: equal, the remainder one point each on the last tests. */
export function splitPoints(total: number, count: number): number[] {
  if (count <= 0) return [];
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_unused, index) =>
    index >= count - remainder ? base + 1 : base,
  );
}

/** Pairs already in the list (same input and output) are dropped from an append. */
export const newPairsOnly = (pairs: FilePair[], existing: { input: string; output: string }[]) => {
  const taken = new Set(existing.map((row) => `${row.input}\n${row.output}`));
  return pairs.filter((pair) => !taken.has(`${pair.input}\n${pair.output}`));
};
