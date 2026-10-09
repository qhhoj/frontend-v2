import type { JsonBodyOf } from '../typed';
import type { Schemas } from '../schemas';

/** A programming language as staff see it (`GET /admin/languages`). */
export type LanguageAdmin = Schemas['LanguageAdminResponse'];
/** `POST /admin/languages` body (`judge.add_language`). */
export type CreateLanguageBody = JsonBodyOf<'/admin/languages', 'post'>;
/** `PATCH /admin/languages/:id` body: no `key` (fixed), and `shortName: null` clears it. */
export type UpdateLanguageBody = JsonBodyOf<'/admin/languages/{id}', 'patch'>;
