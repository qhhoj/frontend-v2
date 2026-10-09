import type { JsonBodyOf } from '../typed';
import type { Schemas } from '../schemas';

/** The list row. */
export type FlatpageListItem = Schemas['FlatpageAdminListItemResponse'];
/** One page, with its Markdown and the sanitised HTML the server rendered. */
export type FlatpageAdmin = Schemas['FlatpageAdminResponse'];
/** A deleted page's last URL; its history is readable by `id`. */
export type DeletedFlatpage = Schemas['FlatpageDeletedResponse'];
/** The body of a create, and the patch of an update. */
export type FlatpageBody = JsonBodyOf<'/admin/site/pages', 'post'>;
/** One entry of the page's history: `create`, `edit` or `delete`. */
export type FlatpageRevision = Omit<Schemas['FlatpageRevisionResponse'], 'changes'> & {
  changes: Record<string, { before: unknown; after: unknown }>;
};
