import type { Schemas } from '../schemas';
/** backend: libs/community VOTE_SCORES; 0 withdraws a vote. */
export type VoteScore = Schemas['VoteScore'];

/** backend: contributions/dto/vote.response.ts (VoteResponse) */
export interface VoteResponse {
  score: number;
  viewerVote: VoteScore;
}
