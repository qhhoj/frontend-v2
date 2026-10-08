import type { StatementLanguage } from './problems';

/** backend: the `UserSummary` shape the problem detail sends for every person it names. */
export interface UserSummaryView {
  id: string;
  username: string;
}

/** backend: problems/core/dto/problem-meta.response.ts (`LanguageResponse`). */
export interface LanguageOption {
  id: string;
  key: string;
  name: string;
}

/** backend: problems/core/dto/problem-meta.response.ts (`CatalogItemResponse`): a type or a group with its full name. */
export interface CatalogOption {
  id: string;
  name: string;
  fullName: string;
}

/** backend: problems/core/dto/problem-meta.response.ts (`LicenseResponse`). */
export interface LicenseOption {
  id: string;
  key: string;
  name: string;
}

/** backend: problems/core/dto/problem-meta.response.ts (`ProblemMetaResponse`). */
export interface ProblemEditingMeta {
  types: CatalogOption[];
  groups: CatalogOption[];
  licenses: LicenseOption[];
  languages: LanguageOption[];
}

/** backend: problems/core/dto/problem-detail.response.ts (`ProblemTranslationResponse`). */
export interface ProblemTranslation {
  language: StatementLanguage;
  name: string;
  description: string;
}

/** backend: problems/core/dto/problem-detail.response.ts (`ProblemEditorialDraftResponse`). */
export interface EditorialDraft {
  isPublic: boolean;
  publishOn: string;
  authors: UserSummaryView[];
  content: string;
}

/** backend: problems/core/dto/problem-detail.response.ts (`ProblemEditorResponse`): sent to editors only. */
export interface ProblemEditor {
  description: string;
  translations: ProblemTranslation[];
  solution: EditorialDraft | null;
  curators: UserSummaryView[];
  testers: UserSummaryView[];
  bannedUsers: UserSummaryView[];
  suggester: UserSummaryView | null;
  typeIds: string[];
  groupId: string;
  licenseId: string | null;
  allowedLanguageIds: string[];
  organizations: string[];
}

/** backend: problems/core/dto/problem-detail.response.ts (`LanguageLimitResponse`). */
export interface ProblemLanguageLimit {
  language: string;
  timeLimit: number;
  memoryLimit: number;
}

/** backend: problems/core/dto/problem-detail.response.ts, `submissionSourceVisibility`. */
export type SourceVisibility = 'F' | 'A' | 'S' | 'O';
/** backend: problems/core/dto/problem-detail.response.ts, `testcaseVisibility`. */
export type TestcaseVisibility = 'O' | 'C' | 'A';
/** backend: problems/core/dto/problem-detail.response.ts, `testcaseResultVisibility`. */
export type ResultVisibility = 'A' | 'B' | 'S';

/** backend: problems/core/dto/problem-detail.response.ts (`ProblemDetailResponse`), read with `lang=en`. */
export interface EditableProblem {
  id: string;
  code: string;
  name: string;
  source: string;
  summary: string;
  date: string | null;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  partial: boolean;
  isPublic: boolean;
  isManuallyManaged: boolean;
  isFullMarkup: boolean;
  isOrganizationPrivate: boolean;
  authors: UserSummaryView[];
  languageLimits: ProblemLanguageLimit[];
  pdfStatementUrl: string | null;
  materialUrl: string | null;
  submissionSourceVisibility: SourceVisibility;
  testcaseVisibility: TestcaseVisibility;
  testcaseResultVisibility: ResultVisibility;
  allowViewFeedback: boolean;
  canEdit: boolean;
  editor: ProblemEditor | null;
}

/** backend: problems/editing/dto/problem-edit.dto.ts (`CreateProblemDto`): the body of `POST /problems`. */
export interface ProblemBody {
  code: string;
  name: string;
  source?: string;
  summary?: string;
  description?: string;
  timeLimit: number;
  memoryLimit: number;
  points: number;
  partial?: boolean;
  typeIds: string[];
  groupId: string;
  licenseId?: string | null;
  submissionSourceVisibility?: SourceVisibility;
  testcaseVisibility?: TestcaseVisibility;
  testcaseResultVisibility?: ResultVisibility;
  allowViewFeedback?: boolean;
  testers?: string[];
  languageLimits?: { languageId: string; timeLimit: number; memoryLimit: number }[];
  isPublic?: boolean;
  isManuallyManaged?: boolean;
  isFullMarkup?: boolean;
  authors?: string[];
  curators?: string[];
  bannedUsers?: string[];
  allowedLanguages?: string[];
  organizations?: string[];
  isOrganizationPrivate?: boolean;
  ogImage?: string;
  date?: string;
}

/** backend: problems/editing/dto/problem-edit.dto.ts (`UpdateProblemDto`): `PATCH /problems/:code`, omitted fields stay unchanged. */
export type ProblemPatch = Partial<ProblemBody>;

/** backend: problems/editing/dto/editorial.dto.ts (`PutEditorialDto`). */
export interface EditorialDraftBody {
  isPublic: boolean;
  publishOn: string;
  authors?: string[];
  content: string;
}
