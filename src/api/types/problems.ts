/** backend: libs/database STATEMENT_LANGUAGES; equal to the UI locales. */
export type StatementLanguage = 'vi' | 'en';

/** backend: apps/api/src/modules/problems/core/dto/problem-meta.response.ts (CatalogItemResponse) */
export interface CatalogItem {
  id: string;
  name: string;
  fullName: string;
}

/** backend: problem-meta.response.ts (LanguageResponse) */
export interface Language {
  id: string;
  key: string;
  name: string;
  shortName: string | null;
  commonName: string;
  ace: string;
  extension: string;
  template: string;
  fileOnly: boolean;
  fileSizeLimit: number;
  includeInProblem: boolean;
}

/** backend: problem-meta.response.ts (ProblemMetaResponse; licenses not used yet) */
export interface ProblemMeta {
  types: CatalogItem[];
  groups: CatalogItem[];
  languages: Language[];
}

/** backend: problems/core/viewer-status.repository.ts */
export type ViewerStatus = 'solved' | 'attempted' | null;

/** backend: problems/core/dto/problem-list.response.ts */
export interface ProblemListItem {
  id: string;
  code: string;
  name: string;
  group: CatalogItem | null;
  types: CatalogItem[];
  points: number;
  partial: boolean;
  userCount: number;
  /** Percent, 0..100. */
  acRate: number;
  date: string | null;
  isPublic: boolean;
  isOrganizationPrivate: boolean;
  hasPublicEditorial: boolean;
  hasPdfStatement: boolean;
  viewerStatus: ViewerStatus;
}

/** backend: problems/core/problem-search.ts PROBLEM_SORT_FIELDS; a sort is a field or `-field`. */
export const PROBLEM_SORT_FIELDS = [
  'date',
  'code',
  'name',
  'points',
  'acRate',
  'userCount',
] as const;
export type ProblemSortField = (typeof PROBLEM_SORT_FIELDS)[number];
export type ProblemSort = ProblemSortField | `-${ProblemSortField}`;
export const isProblemSort = (value: unknown): value is ProblemSort =>
  typeof value === 'string' &&
  (PROBLEM_SORT_FIELDS as readonly string[]).includes(value.replace(/^-/, ''));

/** backend: problems/core/dto/problem-list.dto.ts; null and empty values are not sent. */
export interface ProblemListQuery {
  page: number;
  pageSize: number;
  lang: StatementLanguage;
  search?: string;
  typeIds?: string[];
  pointsMin?: number | null;
  pointsMax?: number | null;
  sort?: ProblemSort | null;
}

/** backend: problems/core/dto/user-summary.response.ts */
export interface UserSummary {
  id: string;
  username: string;
}
/** backend: problem-detail.response.ts ProblemContestResponse (B19) */
export interface ProblemContest {
  contestKey: string;
  attemptsLeft: number | null;
}
/** backend: problem-detail.response.ts ProblemDetailResponse (the editor block, licence, material, visibility settings and flags 8c does not read are omitted) */
export interface ProblemDetail {
  id: string;
  code: string;
  name: string;
  language: StatementLanguage;
  translated: boolean;
  descriptionHtml: string;
  source: string;
  summary: string;
  /** Seconds. */ timeLimit: number;
  /** KiB. */ memoryLimit: number;
  points: number;
  partial: boolean;
  types: CatalogItem[];
  group: CatalogItem | null;
  authors: UserSummary[];
  allowedLanguages: Language[];
  /** `language` is the language `key`. */
  languageLimits: Array<{ language: string; timeLimit: number; memoryLimit: number }>;
  pdfStatementUrl: string | null;
  availableTranslations: StatementLanguage[];
  /** False inside a contest and when the viewer may not read it. */
  hasEditorial: boolean;
  userCount: number;
  acRate: number;
  canEdit: boolean;
  viewerStatus: ViewerStatus;
  contest: ProblemContest | null;
}
/** backend: problems/core/dto/editorial.response.ts (`problem` is ProblemRefResponse) */
export interface ProblemEditorial {
  problem: { code: string; name: string };
  isPublic: boolean;
  publishOn: string;
  authors: UserSummary[];
  contentHtml: string;
  canEdit: boolean;
}
