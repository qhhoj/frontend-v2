/**
 * Matches a route key (`GET /problems/aplusb`) against a pattern. A `:name` segment matches any one segment and
 * is returned as a param; a trailing `*` matches one or more remaining segments (`GET /pages/*`).
 */
export function matchPattern(pattern: string, key: string): Record<string, string> | null {
  const patternParts = pattern.split('/');
  const keyParts = key.split('/');
  const wildcard = patternParts.at(-1) === '*';
  const sameLength = keyParts.length === patternParts.length;
  if (wildcard ? keyParts.length < patternParts.length : !sameLength) return null;
  const params: Record<string, string> = {};
  for (const [index, part] of patternParts.entries()) {
    if (part === '*') break;
    const segment = keyParts[index] ?? '';
    if (part.startsWith(':')) params[part.slice(1)] = decodeURIComponent(segment);
    else if (part !== segment) return null;
  }
  return params;
}
