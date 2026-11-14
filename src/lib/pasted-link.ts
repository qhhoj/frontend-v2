/**
 * The segment a pasted link holds after `/<section>/`: `https://host/problems/aplusb?tab=x#y` with section `problems` is
 * `aplusb`. Accepts a full URL or a bare path; any other text is not a link, so null.
 */
export function pastedLinkSegment(text: string, section: string): string | null {
  const pathname = pathOf(text.trim());
  const match = pathname && new RegExp(`^/${section}/([^/]+)`).exec(pathname);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]!);
  } catch {
    return match[1]!;
  }
}

function pathOf(text: string): string | null {
  if (text.startsWith('/')) return text.split(/[?#]/)[0]!;
  if (!/^https?:\/\//i.test(text)) return null;
  try {
    return new URL(text).pathname;
  } catch {
    return null;
  }
}
