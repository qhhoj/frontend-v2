import type { Schemas } from '../schemas';
import type { JsonBodyOf } from '../typed';
import type { UserSummary } from './problems';

export type UserSummaryView = UserSummary;
export type LanguageOption = Schemas['LanguageResponse'];
export type CatalogOption = Schemas['CatalogItemResponse'];
export type LicenseOption = Schemas['LicenseResponse'];
export type ProblemEditingMeta = Schemas['ProblemMetaResponse'];
export type ProblemTranslation = Schemas['ProblemTranslationResponse'];
export type EditorialDraft = Schemas['ProblemEditorialDraftResponse'];
/** Sent to editors only. */
export type ProblemEditor = Schemas['ProblemEditorResponse'];
export type ProblemLanguageLimit = Schemas['LanguageLimitResponse'];
/** The detail with its editor block, which holds the base-language texts. */
export type EditableProblem = Schemas['ProblemDetailResponse'];

/** The body of `POST /problems`. */
export type ProblemBody = JsonBodyOf<'/problems', 'post'>;
/** `PATCH /problems/{code}`: omitted fields stay unchanged. */
export type ProblemPatch = JsonBodyOf<'/problems/{code}', 'patch'>;
export type EditorialDraftBody = JsonBodyOf<'/problems/{code}/editorial', 'put'>;
export type SourceVisibility = NonNullable<ProblemBody['submissionSourceVisibility']>;
export type TestcaseVisibility = NonNullable<ProblemBody['testcaseVisibility']>;
export type ResultVisibility = NonNullable<ProblemBody['testcaseResultVisibility']>;
