import { apiGet, apiSend } from './typed';
import { fileBody } from './problem-data.api';
import type { ImportJob, ImportOptions } from './types/problem-imports';

/** P6: options travel in the query string (repeated keys for lists); the multipart body carries only `file`. */
export const startZipImport = (options: ImportOptions, file: File) =>
  apiSend('post', '/problems/imports', { query: options, ...fileBody(file) });

export const fetchImportJob = (jobId: string): Promise<ImportJob> =>
  apiGet('/problems/imports/{jobId}', { path: { jobId } });

/** The viewer's own import and sync jobs of the last day, running and finished, newest first. */
export const fetchMyImports = (): Promise<ImportJob[]> =>
  apiGet('/problems/imports', { query: { mine: true } });
