import type { Schemas } from '../schemas';
/** backend: libs/community VOTE_SCORES; 0 withdraws a vote. */
export type VoteScore = Schemas['VoteScore'];

/** backend: contributions/dto/vote.response.ts (VoteResponse); the document omits `viewerVote` (ask M5-01, docs/api-mismatches/community.md). */
export type VoteResponse = Schemas['VoteResponse'] & Record<'viewerVote', VoteScore>;
