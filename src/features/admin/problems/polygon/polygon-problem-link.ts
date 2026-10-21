import { ApiError } from '@/api/client';

/** A Polygon problem page address: `https://polygon.codeforces.com/<token>/<owner>/<name>`. */
export interface PolygonProblemLink {
  /** The 7-character `p…` part: the permission, checked by the server against the newest package. */
  token: string;
  owner: string;
  name: string;
}

/** Same rules as the server's parser (it decides; this one only says when a check is worth sending). */
const MAX_LENGTH = 300;
const HOST = 'polygon.codeforces.com';
const TOKEN = /^p[0-9A-Za-z]{6}$/;
const OWNER = /^[A-Za-z0-9_.-]{1,24}$/;
const NAME = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * A pasted link as the server's https-only parser expects it: surrounding spaces, a trailing "." and wrapping `<>`
 * (how chat apps and sentences deliver a link) are dropped, and `http://` or no scheme becomes `https://`.
 */
function withHttps(text: string): string {
  const unwrapped = text
    .trim()
    .replace(/\.$/, '')
    .replace(/^<(.*)>$/, '$1')
    .trim();
  if (/^https:\/\//i.test(unwrapped)) return unwrapped;
  if (/^http:\/\//i.test(unwrapped)) return unwrapped.replace(/^http/i, 'https');
  return unwrapped.toLowerCase().startsWith(`${HOST}/`) ? `https://${unwrapped}` : unwrapped;
}

/** The address the server is asked to check for these parts. */
export const polygonLinkUrl = ({ token, owner, name }: PolygonProblemLink) =>
  `https://${HOST}/${token}/${owner}/${name}`;

/** The parts of a pasted link, or null: the exact host, three path segments; a query or fragment is ignored. */
export function parsePolygonLink(text: string): PolygonProblemLink | null {
  const trimmed = withHttps(text);
  if (trimmed.length > MAX_LENGTH) return null;
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || url.hostname !== HOST) return null;
  if (url.port || url.username || url.password) return null;
  const [token = '', owner = '', name = '', ...rest] = url.pathname
    .replace(/^\//, '')
    .replace(/\/$/, '')
    .split('/');
  if (rest.length > 0 || !TOKEN.test(token) || !OWNER.test(owner) || !NAME.test(name)) return null;
  return { token, owner, name };
}

/** Polygon's working pages carry the editing session (`?ccid=…&session=…`) or the numeric id (`edit-start?problemId=…`). */
const EDITING_PARAMS = ['ccid', 'session', 'problemId'];

/** A polygon.codeforces.com address of a working page (an editing session), not the problem's share link. */
function isEditingAddress(text: string): boolean {
  let url: URL;
  try {
    url = new URL(withHttps(text));
  } catch {
    return false;
  }
  return url.hostname === HOST && EDITING_PARAMS.some((param) => url.searchParams.has(param));
}

/** Polygon's newest package when none is READY: `newestPackage` of a 409 `polygon_package_not_ready`. */
export interface NewestPackage {
  id: number;
  revision: number;
  state: 'RUNNING' | 'FAILED';
  /** Polygon's comment on the build, such as why it failed; null when it wrote none. */
  comment: string | null;
}

/** Why a link was refused, as the link step shows it; anything else is a plain failure line. */
export type LinkRefusal =
  | { kind: 'invalid' }
  | { kind: 'editing' }
  | { kind: 'refused' }
  | { kind: 'noPackage' }
  | { kind: 'notReady'; newest: NewestPackage | null }
  | { kind: 'checking'; retryAfterSeconds: number | null }
  | { kind: 'linked'; code: string | null }
  | { kind: 'linkedDeleted'; code: string | null }
  | { kind: 'other'; error: unknown };

/** What the pasted text alone says, before any check: null when it is empty or reads as a problem link. */
export function textRefusalOf(text: string): LinkRefusal | null {
  if (text.trim() === '' || parsePolygonLink(text)) return null;
  return isEditingAddress(text) ? { kind: 'editing' } : { kind: 'invalid' };
}

const NEWEST_STATES: ReadonlySet<unknown> = new Set(['RUNNING', 'FAILED']);

/** The `newestPackage` member as sent, or null when it is missing or malformed. */
function newestPackageOf(value: unknown): NewestPackage | null {
  const newest = value as Partial<NewestPackage> | null | undefined;
  if (typeof newest?.id !== 'number' || typeof newest.revision !== 'number') return null;
  if (!NEWEST_STATES.has(newest.state)) return null;
  const comment = typeof newest.comment === 'string' && newest.comment ? newest.comment : null;
  const state = newest.state as NewestPackage['state'];
  return { id: newest.id, revision: newest.revision, state, comment };
}

/** `linkedProblemCode` is sent only to a user who may edit that problem. */
const linkedCodeOf = (error: ApiError) => {
  const code = error.extra.linkedProblemCode;
  return typeof code === 'string' ? code : null;
};

/** nginx answers 504 when the first check of a large package outlives the proxy; the server finishes it anyway. */
const GATEWAY_TIMEOUT = 504;

const FIXED_REFUSALS: Record<string, LinkRefusal> = {
  polygon_link_invalid: { kind: 'invalid' },
  polygon_link_refused: { kind: 'refused' },
  polygon_no_package: { kind: 'noPackage' },
};

/** `refused` covers both "not shared with the account" and "wrong token": the server answers both alike. */
export function linkRefusalOf(error: unknown): LinkRefusal {
  if (!(error instanceof ApiError)) return { kind: 'other', error };
  if (Object.hasOwn(FIXED_REFUSALS, error.code)) return FIXED_REFUSALS[error.code]!;
  if (error.code === 'polygon_link_checking' || error.status === GATEWAY_TIMEOUT)
    return { kind: 'checking', retryAfterSeconds: error.retryAfterSeconds };
  switch (error.code) {
    case 'polygon_package_not_ready':
      return { kind: 'notReady', newest: newestPackageOf(error.extra.newestPackage) };
    case 'polygon_already_linked':
      return { kind: 'linked', code: linkedCodeOf(error) };
    case 'polygon_linked_deleted':
      return { kind: 'linkedDeleted', code: linkedCodeOf(error) };
    default:
      return { kind: 'other', error };
  }
}
