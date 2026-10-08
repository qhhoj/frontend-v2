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

/** backend: pairs/dto/similarity-pair.response.ts `SimilaritySideResponse`. */
export interface PairSide {
  submissionId: string;
  userId: string;
  /** Empty when the account was deleted. */
  username: string;
}

/** backend: `SimilarityPairResponse`, one row of the pairs list. */
export interface SimilarityPair {
  id: string;
  runId: string;
  problemId: string;
  problemCode: string;
  /** Engine family: `cpp`, `python`, `pascal`, ... */
  language: string;
  /** 0 to 1. */
  similarity: number;
  /** Longest shared fragment, in k-grams. */
  longestFragment: number;
  /** Shared k-grams over both files. */
  totalOverlap: number;
  fragmentCount: number;
  left: PairSide;
  right: PairSide;
}

/** backend: `SimilarityPairSourceResponse`; a deleted submission keeps its side with nulls and an empty source. */
export interface PairDetailSide extends PairSide {
  date: string | null;
  result: string | null;
  points: number | null;
  source: string;
}

/** 1-based, inclusive line ranges: the left file and the right file of one matched region. */
export interface SimilarityFragment {
  leftStart: number;
  leftEnd: number;
  rightStart: number;
  rightEnd: number;
}

/** backend: `SimilarityPairDetailResponse`, the row plus each side's source and the fragments (at most 50). */
export interface SimilarityPairDetail extends Omit<SimilarityPair, 'left' | 'right'> {
  left: PairDetailSide;
  right: PairDetailSide;
  fragments: SimilarityFragment[];
}

/** The query of one pairs page; `minSimilarity` is a 0-1 fraction. */
export interface PairsRequest {
  problemId?: string;
  language?: string;
  minSimilarity?: number;
  page: number;
}
