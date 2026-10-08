/** backend: apps/api/src/modules/home/dto/home.response.ts (HomeCountsResponse) */
export interface HomeCounts {
  users: number;
  problems: number;
  submissions: number;
  /** Contests an anonymous visitor can see. */
  contests: number;
  languages: number;
}
