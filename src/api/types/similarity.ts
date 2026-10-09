import type { Schemas } from '../schemas';
import type { QueryOf } from '../typed';

/** @uiOnly the backend takes both members optional; the page sends exactly one. */
export type SimilarityScope = { problem: string } | { contest: string };
export type SimilarityScopeKind = SimilarityRun['scope'];

export type RunStatus = SimilarityRun['status'];
/** The reason a failed run gives. */
export type RunError = NonNullable<SimilarityRun['error']>;

/** One problem and one engine family (`cpp`, `python`, `pascal`, ...) of a run. */
export type SimilarityGroup = Schemas['SimilarityGroupResponse'];
export type SimilarityRun = Schemas['SimilarityRunResponse'];
export type PairSide = Schemas['SimilaritySideResponse'];
export type SimilarityPair = Schemas['SimilarityPairResponse'];
/** A deleted submission keeps its side with nulls and an empty source. */
export type PairDetailSide = Schemas['SimilarityPairSourceResponse'];
/** 1-based, inclusive line ranges: the left file and the right file of one matched region. */
export type SimilarityFragment = Schemas['SimilarityFragmentResponse'];
export type SimilarityPairDetail = Schemas['SimilarityPairDetailResponse'];

type PairsQuery = QueryOf<'/similarity/runs/{runId}/pairs'>;
/** The query of one pairs page; `minSimilarity` is a 0-1 fraction; the page size is fixed by the API file. */
export type PairsRequest = Omit<PairsQuery, 'page' | 'pageSize'> &
  Required<Pick<PairsQuery, 'page'>>;
