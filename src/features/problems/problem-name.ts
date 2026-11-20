const SEPARATOR = ' - ';

/**
 * A problem's name in two parts: problems of one contest share a prefix ("SQRT Cup 2025 - Vòng loại thứ nhất - "), and the
 * part after the last " - " is what tells them apart. A name without the separator is all `own`.
 */
export function splitProblemName(name: string): { shared: string; own: string } {
  const at = name.lastIndexOf(SEPARATOR);
  const own = at < 0 ? '' : name.slice(at + SEPARATOR.length).trim();
  if (own === '') return { shared: '', own: name };
  return { shared: name.slice(0, at + SEPARATOR.length), own };
}
