import type { JsonBodyOf } from '../typed';
import type { Schemas } from '../schemas';

/** One entry of the navigation bar, as the admin reads it. */
export type NavigationItem = Schemas['NavigationItemResponse'];
/** `GET /site`: the navigation bar and the legacy misc config (served to everyone, so never secrets). */
export type SiteData = Schemas['SiteResponse'];
/** The create body; an update sends any subset. */
export type NavigationBody = JsonBodyOf<'/admin/site/navigation', 'post'>;
