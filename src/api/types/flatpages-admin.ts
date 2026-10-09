import type { UserSummary } from './problems';

/** backend: flatpage-admin.response.ts (the list row). */
export interface FlatpageListItem {
  id: string;
  url: string;
  title: string;
  registrationRequired: boolean;
  updatedAt: string;
}

/** backend: flatpage-admin.response.ts (one page, with its Markdown and the sanitised HTML the server rendered). */
export interface FlatpageAdmin extends FlatpageListItem {
  content: string;
  contentHtml: string;
  createdAt: string;
}

/** backend: flatpage-admin.dto.ts (the body of a create, and the patch of an update). */
export interface FlatpageBody {
  url: string;
  title: string;
  content: string;
  registrationRequired?: boolean;
}

/** backend: flatpage-admin.response.ts (one entry of the page's history: `create`, `edit` or `delete`). */
export interface FlatpageRevision {
  id: string;
  at: string;
  action: 'create' | 'edit' | 'delete';
  /** Null once the editor's account is deleted. */
  editor: UserSummary | null;
  changes: Record<string, { before: unknown; after: unknown }>;
}
