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

/** The parts of a pasted link, or null: https, the exact host, three path segments; a query or fragment is ignored. */
export function parsePolygonLink(text: string): PolygonProblemLink | null {
  const trimmed = text.trim();
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

/** Why a link was refused, as the link step shows it; anything else is a plain failure line. */
export type LinkRefusal =
  | { kind: 'invalid' }
  | { kind: 'refused' }
  | { kind: 'noPackage' }
  | { kind: 'notReady' }
  | { kind: 'linked'; code: string | null }
  | { kind: 'other'; error: unknown };

/** `refused` covers both "not shared with the account" and "wrong token": the server answers both alike. */
export function linkRefusalOf(error: unknown): LinkRefusal {
  if (!(error instanceof ApiError)) return { kind: 'other', error };
  switch (error.code) {
    case 'polygon_link_invalid':
      return { kind: 'invalid' };
    case 'polygon_link_refused':
      return { kind: 'refused' };
    case 'polygon_no_package':
      return { kind: 'noPackage' };
    case 'polygon_package_not_ready':
      return { kind: 'notReady' };
    case 'polygon_already_linked': {
      const code = error.extra.linkedProblemCode;
      return { kind: 'linked', code: typeof code === 'string' ? code : null };
    }
    default:
      return { kind: 'other', error };
  }
}
