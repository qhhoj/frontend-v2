/** backend: apps/api/src/modules/problems/imports/problem-import.dto.ts (`PolygonImportQueryDto`), sent as the query string. */
export interface ImportOptions {
  code: string;
  mode: 'create' | 'update';
  authors: string[];
  curators: string[];
  groupId?: string;
  typeIds: string[];
  points?: number;
  mainStatementLanguage?: string;
  /** `polygon=en` or `polygon=vi` pairs, one per Polygon statement language. */
  statementLanguages: string[];
  tutorialLanguage?: string;
  ignoreZeroPointBatches: boolean;
  ignoreZeroPointCases: boolean;
  appendMainSolution: boolean;
}

/** backend: apps/api/src/modules/problems/imports/dto/import-job.response.ts (`ImportJobResponse`). */
export interface ImportJob {
  id: string;
  /** BullMQ state: waiting, delayed, prioritized, waiting-children, active, completed or failed. */
  state: string;
  result: { problemId: string; code: string } | null;
  error: string | null;
}
