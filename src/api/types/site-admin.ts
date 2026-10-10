import type { Schemas } from '../schemas';

/** `GET /site`: the legacy misc config (served to everyone, so never secrets) and the official-mode flags. */
export type SiteData = Schemas['SiteResponse'];
