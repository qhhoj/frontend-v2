import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';

/** Sent as the query string (`polygon=en` pairs in `statementLanguages`). */
export type ImportOptions = QueryOf<'/problems/imports', 'post'>;
export type ImportJob = Schemas['ImportJobResponse'];
