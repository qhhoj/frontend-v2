import type { ImportJob } from '@/api/types/problem-imports';
import { phaseOf } from '../import/import-job';
import type { ImportPhase } from '../import/import-job';

/** The Polygon imports and syncs among the viewer's jobs; a zip upload (no purpose) has no page to reopen here. */
export const polygonImportsOf = (jobs: ImportJob[]): ImportJob[] =>
  jobs.filter((job) => job.purpose !== null);

/** A row's status in "Lượt nhập của tôi": the job's phase, or `attention` for an import that landed but needs a repair. */
export type MyImportStatus = ImportPhase | 'attention';

export function myImportStatusOf(job: ImportJob): MyImportStatus {
  const phase = phaseOf(job.state);
  return phase === 'done' && job.result?.attention ? 'attention' : phase;
}
