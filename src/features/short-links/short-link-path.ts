/** The five page kinds a short link may lead to (backend allow-list). */
export type ShortLinkTarget =
  | { kind: 'problem'; code: string }
  | { kind: 'contest'; key: string }
  | { kind: 'post'; id: string }
  | { kind: 'user'; username: string }
  | { kind: 'organization'; slug: string };

/** The canonical SPA path, raw (the allow-list takes `@`, `+`, `.` as they are), no query, no fragment. */
export function shortLinkPath(target: ShortLinkTarget): string {
  switch (target.kind) {
    case 'problem':
      return `/problems/${target.code}`;
    case 'contest':
      return `/contests/${target.key}`;
    case 'post':
      return `/blog/${target.id}`;
    case 'user':
      return `/users/${target.username}`;
    case 'organization':
      return `/organizations/${target.slug}`;
  }
}

/** The address a visitor opens: the API answers `/s/<code>` with a redirect to the stored path. */
export const shortLinkUrl = (code: string, origin: string = window.location.origin): string =>
  `${origin}/s/${code}`;

/** "qhhoj.vn/s/k7m2xq": the link as the button announces it. */
export const displayUrl = (url: string): string => url.replace(/^https?:\/\//, '');
