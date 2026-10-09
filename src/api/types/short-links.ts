import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: short-links/dto/short-link.response.ts (ShortLinkResponse) */
export type ShortLink = Schemas['ShortLinkResponse'];
/** backend: short-links/dto (CreateShortLinkDto); `code` and `expiresAt` need judge.manage_short_link */
export type CreateShortLinkBody = JsonBodyOf<'/short-links', 'post'>;
/** backend: short-links/dto (list query: scope, page, pageSize) */
export type ShortLinkListQuery = QueryOf<'/short-links'>;
/** backend: new links per user per day (staff with judge.manage_short_link are exempt); the 429 text names it. */
export const SHORT_LINK_DAILY_LIMIT = 20;
