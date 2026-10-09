import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** backend: contests/tags/dto/contest-tag.response.ts (ContestTagResponse) */
export type ContestTag = Schemas['ContestTagResponse'];
/** backend: contests/tags/dto/contest-tag.dto.ts (CreateContestTagDto) */
export type ContestTagBody = JsonBodyOf<'/contest-tags', 'post'>;
/** backend: contests/tags/dto/contest-tag.dto.ts (UpdateContestTagDto) */
export type ContestTagPatch = JsonBodyOf<'/contest-tags/{slug}', 'patch'>;
