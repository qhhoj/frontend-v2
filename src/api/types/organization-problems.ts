import type { Schemas } from '../schemas';
import type { JsonBodyOf, QueryOf } from '../typed';

/** backend: organizations/problem-tags/dto/problem-tag.response.ts (ProblemTagResponse) */
export type ProblemTag = Schemas['ProblemTagResponse'];
/** backend: organizations/problems/dto/organization-problem.response.ts (OrganizationProblemResponse) */
export type OrganizationProblem = Schemas['OrganizationProblemResponse'];
/** backend: organizations/problems/dto/organization-problem.dto.ts (enum OrganizationProblemArchiveFilter) */
export type OrganizationProblemArchiveFilter = Schemas['OrganizationProblemArchiveFilter'];
export type OrganizationProblemQuery = QueryOf<'/organizations/{slug}/problems'>;
export type ProblemTagBody = JsonBodyOf<'/organizations/{slug}/problem-tags', 'post'>;
export type ProblemTagChanges = JsonBodyOf<'/organizations/{slug}/problem-tags/{tagSlug}', 'patch'>;
export type BulkBody = JsonBodyOf<'/organizations/{slug}/problems/bulk', 'post'>;
/** backend: organizations/problems/dto/bulk.dto.ts (enum OrganizationProblemBulkAction) */
export type BulkAction = Schemas['OrganizationProblemBulkAction'];
/** backend: organizations/problems/dto/bulk.response.ts (BulkProblemsResponse) */
export type BulkProblemsResult = Schemas['BulkProblemsResponse'];
/** backend: organizations/problems/dto/bulk.response.ts (BulkResultResponse) */
export type BulkResult = Schemas['BulkResultResponse'];
/** backend: organizations/problems/dto/archived-in.response.ts (ArchivedInResponse) */
export type ArchivedIn = Schemas['ArchivedInResponse'];
