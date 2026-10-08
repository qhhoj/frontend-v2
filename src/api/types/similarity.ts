/** backend: apps/api/src/modules/similarity/core/dto/scope-query.dto.ts. Exactly one of the two is sent. */
export type SimilarityScope = { problem: string } | { contest: string };
export type SimilarityScopeKind = 'problem' | 'contest';

/** backend: similarity-run.response.ts `SimilarityRunResponse.status`. */
export type RunStatus = 'queued' | 'running' | 'done' | 'failed';
/** backend: `SIMILARITY_ERRORS`, the reason a failed run gives. */
export type RunError = 'deadline' | 'engine_failed' | 'internal_error' | 'abandoned';

/** One problem and one engine family (`cpp`, `python`, `pascal`, ...) of a run. */
export interface SimilarityGroup {
  problemId: string;
  problemCode: string;
  language: string;
  tokenizer: 'syntax' | 'text';
  /** Submissions of the family in scope, before the cap. */
  submissionCount: number;
  /** Compared after the cap and the skips. */
  comparedCount: number;
  skippedEmpty: number;
  skippedTooLarge: number;
  /** Only the newest `limits.maxSubmissions` were compared. */
  truncated: boolean;
  pairCount: number;
  /** The engine failed on this group alone; the rest of the run completed. */
  failed: boolean;
}

export interface SimilarityRun {
  id: string;
  scope: SimilarityScopeKind;
  problemId: string | null;
  contestId: string | null;
  status: RunStatus;
  error: RunError | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  limits: { minPercent: number; maxPairs: number; maxSubmissions: number };
  groups: SimilarityGroup[];
  /** Languages the engine cannot compare, with how many submissions they had. */
  unsupported: { language: string; submissionCount: number }[];
}
