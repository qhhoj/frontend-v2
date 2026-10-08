/** backend: libs/community VOTE_SCORES; 0 withdraws a vote. */
export type VoteScore = -1 | 0 | 1;

/** backend: contributions/dto/vote.response.ts (VoteResponse) */
export interface VoteResponse {
  score: number;
  viewerVote: VoteScore;
}
