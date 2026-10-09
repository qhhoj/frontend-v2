import { apiPage } from './client';
import type { Page } from './client';
import type { ProblemListItem, StatementLanguage } from './types/problems';

export interface AdminProblemSearch {
  page: number;
  pageSize: number;
  lang: StatementLanguage;
  search: string;
}

/** The staff index of problems: `visibility=all` adds private problems (the backend still limits the list to what the account may see). */
export const fetchAdminProblems = (query: AdminProblemSearch): Promise<Page<ProblemListItem>> =>
  apiPage<ProblemListItem>('/problems', { query: { ...query, visibility: 'all' } });
