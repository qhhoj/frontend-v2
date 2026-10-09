import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';

/** backend: contests/tags/dto/contest-tag.response.ts (ContestTagResponse) */
export type ContestTag = Schemas['ContestTagResponse'];
/** backend: libs/database contest-tag.schema.ts CONTEST_TAG_COLORS: a theme token key, `tag-1`..`tag-8`. */
export type ContestTagColor = Schemas['ContestTagColor'];
/** backend: contests/tags/dto/contest-tag.dto.ts (CreateContestTagDto) */
export type ContestTagBody = JsonBodyOf<'/contest-tags', 'post'>;
/** backend: contests/tags/dto/contest-tag.dto.ts (UpdateContestTagDto) */
export type ContestTagPatch = JsonBodyOf<'/contest-tags/{slug}', 'patch'>;
