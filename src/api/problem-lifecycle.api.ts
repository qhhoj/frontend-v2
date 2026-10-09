import type { Page } from './client';
import { apiGetPage, apiSend } from './typed';
import type { DeletedProblem, PurgeQueued } from './types/problem-lifecycle';

export const DELETED_PAGE_SIZE = 50;

export const fetchDeletedProblems = (page: number): Promise<Page<DeletedProblem>> =>
  apiGetPage('/problems/deleted', { query: { page, pageSize: DELETED_PAGE_SIZE } });

/** `confirmCode` is what the user typed; the backend refuses anything but the exact code (400). */
export const deleteProblem = (code: string, confirmCode: string): Promise<void> =>
  apiSend('delete', '/problems/{code}', { path: { code }, body: { confirmCode } });

export const restoreProblem = (code: string): Promise<void> =>
  apiSend('post', '/problems/{code}/restore', { path: { code } });

/** Superusers only; 202: the worker purges later, the row is not purged yet when this resolves. */
export const purgeProblemNow = (code: string, confirmCode: string): Promise<PurgeQueued> =>
  apiSend('post', '/problems/{code}/purge-now', { path: { code }, body: { confirmCode } });
