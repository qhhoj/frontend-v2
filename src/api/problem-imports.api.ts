import { apiRequest } from './client';
import type { QueryValue } from './client';
import type { ImportJob, ImportOptions } from './types/problem-imports';

/** P6: options travel in the query string (repeated keys for lists); the multipart body carries only `file`. */
export function startPolygonImport(options: ImportOptions, file: File) {
  const body = new FormData();
  body.append('file', file);
  return apiRequest<{ jobId: string }>('/problems/imports', {
    method: 'POST',
    query: options as unknown as Record<string, QueryValue>,
    body,
  });
}

export const fetchImportJob = (jobId: string) =>
  apiRequest<ImportJob>(`/problems/imports/${encodeURIComponent(jobId)}`);
