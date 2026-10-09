import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** backend: contests/ghosts/dto/ghosts.dto.ts (GhostResponse); `isUnranked` is derived from the current format on every read. */
export type Ghost = Schemas['GhostResponse'];
/** backend: GhostCellResponse. */
export type GhostCellView = Schemas['GhostCellResponse'];
/** backend: GhostListResponse. */
export type GhostList = Schemas['GhostListResponse'];
/** backend: GhostImportResponse; `stored` is false for a `dryRun`. */
export type GhostImport = Schemas['GhostImportResponse'];
/** backend: ImportGhostsDto. */
export type ImportGhostsBody = JsonBodyOf<'/contests/{key}/ghosts', 'put'>;
